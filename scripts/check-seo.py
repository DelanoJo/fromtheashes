#!/usr/bin/env python3
"""Crawl public HTML and local assets using only the Python standard library.

Usage: python3 scripts/check-seo.py [http://127.0.0.1:4175]
Optional origin checks HTTP status as well as source files; never submits forms.
"""
import json
from pathlib import Path
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote, urljoin
from urllib.request import urlopen
from urllib.error import HTTPError
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CANONICAL = 'https://fromtheashes.fit'
PREVIEW = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else None


class Page(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.tags = []
        self.title = ''
        self.json = []
        self.in_title = False
        self.in_json = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        self.in_title = self.in_title or tag == 'title'
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.in_json = True
            self.json.append('')

    def handle_endtag(self, tag):
        if tag == 'title': self.in_title = False
        if tag == 'script': self.in_json = False

    def handle_data(self, value):
        if self.in_title: self.title += value
        if self.in_json: self.json[-1] += value

    def meta(self, key, attr='name'):
        return [a.get('content', '') for t, a in self.tags if t == 'meta' and a.get(attr) == key]


def disk_path(path):
    target = ROOT / unquote(path).lstrip('/')
    return target / 'index.html' if target.is_dir() or path.endswith('/') else target


def crawl():
    issues = []
    pages = {}
    titles = set()
    descriptions = set()
    sitemap = [e.text for e in ET.parse(ROOT / 'sitemap.xml').findall('{*}url/{*}loc')]
    assert len(sitemap) == len(set(sitemap)), 'Duplicate sitemap URLs'
    assert f'Sitemap: {CANONICAL}/sitemap.xml' in (ROOT / 'robots.txt').read_text()
    assert not re.search(r'^Disallow:\s*/\s*$', (ROOT / 'robots.txt').read_text(), re.M)
    expected = {CANONICAL + '/', *[CANONICAL + '/' + p.name for p in ROOT.glob('*.html')
                                 if p.name not in ('index.html', 'services.html', '404.html', 'print-review.html')]}
    expected.add(CANONICAL + '/denver-personal-trainer/')
    if set(sitemap) != expected: issues.append('Sitemap differs from canonical indexable pages')

    for file in [*ROOT.glob('*.html'), ROOT / 'denver-personal-trainer/index.html']:
        source = file.read_text()
        rel = file.relative_to(ROOT).as_posix()
        path = '/' if rel == 'index.html' else '/' + rel.replace('denver-personal-trainer/index.html', 'denver-personal-trainer/')
        page = Page(source)
        pages[path] = page
        if re.search(r'mia\.burkhardt@outlook\.com', source): issues.append(f'{path}: outdated email')
        if re.search(r'\$\s*\d', source): issues.append(f'{path}: unexpected visible pricing')
        canonical = [a['href'] for t, a in page.tags if t == 'link' and a.get('rel') == 'canonical']
        if path == '/services.html':
            if canonical != [CANONICAL + '/denver-personal-trainer/']:
                issues.append('Services redirect has the wrong canonical destination')
            refresh = [a.get('content') for t, a in page.tags if t == 'meta' and a.get('http-equiv') == 'refresh']
            if refresh != ['0; url=/denver-personal-trainer/']:
                issues.append('Services is missing its instant redirect')
            if any('noindex' in s for s in page.meta('robots')):
                issues.append('Services redirect should remain crawlable for consolidation')
            continue
        if canonical != [CANONICAL + path]: issues.append(f'{path}: wrong canonical {canonical}')
        if path in ('/404.html', '/print-review.html'):
            if not any('noindex' in s for s in page.meta('robots')): issues.append(f'{path}: missing intentional noindex')
            continue
        if any('noindex' in s for s in page.meta('robots')): issues.append(f'{path}: blocked from indexing')
        if '/js/consent.js' not in source or '<script async src="https://www.googletagmanager.com' in source:
            issues.append(f'{path}: missing consent-first analytics loader')
        if sum(t == 'h1' for t, a in page.tags) != 1: issues.append(f'{path}: expected one H1')
        if not page.title or page.title in titles: issues.append(f'{path}: missing/duplicate title')
        titles.add(page.title)
        desc = page.meta('description')
        if len(desc) != 1 or not desc[0] or desc[0] in descriptions: issues.append(f'{path}: missing/duplicate description')
        descriptions.update(desc)
        for key, value in [('og:url', CANONICAL + path), ('og:title', page.title), ('og:description', desc[0])]:
            if page.meta(key, 'property') != [value]: issues.append(f'{path}: inconsistent {key}')
        for key in ('og:image', 'og:image:alt', 'og:site_name'):
            if not page.meta(key, 'property'): issues.append(f'{path}: missing {key}')
        if not page.json: issues.append(f'{path}: missing JSON-LD')
        for value in page.json:
            graph = json.loads(value)
            for item in graph.get('@graph', [graph]):
                if item['@type'] == 'LocalBusiness':
                    if item.get('email') != 'mia@fromtheashes.fit': issues.append(f'{path}: wrong business email')
                    if item.get('telephone') != '+1-720-336-9665': issues.append(f'{path}: wrong business phone')
                    if any(k in item for k in ['address', 'geo', 'aggregateRating', 'review', 'priceRange']): issues.append(f'{path}: unapproved business facts')
        for tag, attrs in page.tags:
            if tag == 'img' and (not attrs.get('alt') or not attrs.get('width') or not attrs.get('height')):
                issues.append(f'{path}: image missing alt or dimensions: {attrs.get("src")}')
        print(f'OK metadata: {path} ({len(page.title)} title characters)')

    targets = {'/robots.txt', '/sitemap.xml'}
    for path, page in pages.items():
        targets.add(path)
        ids = [a['id'] for t, a in page.tags if 'id' in a]
        if len(ids) != len(set(ids)): issues.append(f'{path}: duplicate IDs')
        for tag, attrs in page.tags:
            value = attrs.get('src') if tag in ('script', 'img') else attrs.get('href') if tag in ('a', 'link') else None
            if not value: continue
            link = urlparse(urljoin(CANONICAL + path, value))
            if tag == 'a' and link.netloc == 'fromtheashes.fit' and link.path == '/services.html':
                issues.append(f'{path}: link still points at retired Services page')
            if link.netloc != 'fromtheashes.fit' or link.scheme not in ('http', 'https'): continue
            target = disk_path(link.path)
            if not target.is_file(): issues.append(f'{path}: broken local target {value}')
            else:
                targets.add(link.path)
                if link.fragment and target.suffix == '.html':
                    linked = Page(target.read_text())
                    if not any(a.get('id') == unquote(link.fragment) for t, a in linked.tags):
                        issues.append(f'{path}: broken fragment {value}')

    if PREVIEW:
        for target in sorted(targets):
            try:
                with urlopen(PREVIEW + target, timeout=15) as response:
                    if response.status != 200: issues.append(f'{target}: HTTP {response.status}')
            except Exception as error: issues.append(f'{target}: {error}')
        try:
            urlopen(PREVIEW + '/not-a-real-page-seo-check/', timeout=15)
            issues.append('Missing page returned success instead of 404')
        except HTTPError as error:
            if error.code != 404: issues.append(f'Missing page returned {error.code}')

    if issues:
        print('\n'.join(issues))
        raise SystemExit(1)
    print(f'PASS: {len(sitemap)} indexable pages, 1 legacy redirect, 2 intentionally noindexed pages, {len(targets)} local HTTP targets; canonical URLs, metadata, schema, links, fragments and images verified.')


if __name__ == '__main__':
    crawl()
