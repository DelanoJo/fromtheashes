# From The Ashes Fitness Website

Professional fitness training website for Mia Johnson's personal training business.

## Website Features

- Responsive design for all devices
- Service information and pricing
- Client testimonials
- Program descriptions
- Contact form for consultation booking
- Mobile-friendly navigation
- SEO optimized

## Deployment Instructions

### Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click "New" to create a new repository
3. Name it `fromtheashes-site` (or your preferred name)
4. Make sure it's set to **Public**
5. Don't initialize with README (we already have one)
6. Click "Create repository"

### Step 2: Push Code to GitHub

Run these commands in your terminal from the project directory:

```bash
cd fromtheashes-site
git init
git add .
git commit -m "Initial commit - From The Ashes Fitness website"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fromtheashes-site.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings" tab
3. Scroll down to "Pages" section in the left sidebar
4. Under "Source", select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Click "Save"

### Step 4: Configure Custom Domain (fromtheashes.fit)

#### On GitHub:
1. In the same Pages settings, under "Custom domain"
2. Enter `fromtheashes.fit`
3. Click "Save"
4. Check "Enforce HTTPS" (may take a few minutes to be available)

#### On Namecheap:
1. Log into your Namecheap account
2. Go to Domain List and click "Manage" next to fromtheashes.fit
3. Go to "Advanced DNS" tab
4. Add these DNS records:

**For apex domain (fromtheashes.fit):**
- Type: A Record
- Host: @
- Value: 185.199.108.153
- TTL: Automatic

- Type: A Record
- Host: @
- Value: 185.199.109.153
- TTL: Automatic

- Type: A Record
- Host: @
- Value: 185.199.110.153
- TTL: Automatic

- Type: A Record
- Host: @
- Value: 185.199.111.153
- TTL: Automatic

**For www subdomain (www.fromtheashes.fit):**
- Type: CNAME Record
- Host: www
- Value: YOUR_USERNAME.github.io
- TTL: Automatic

Replace `YOUR_USERNAME` with your GitHub username.

5. Remove any conflicting records (like default parking page records)
6. Save all changes

### Step 5: Wait for Propagation

- DNS changes can take up to 48 hours to propagate (usually much faster)
- Your site should be accessible at:
  - https://fromtheashes.fit
  - https://www.fromtheashes.fit
  - https://YOUR_USERNAME.github.io/fromtheashes-site

## Important Setup Tasks

### 1. Set Up Form Handling

The contact form needs a backend service. Sign up for [Formspree](https://formspree.io):

1. Create a free account at formspree.io
2. Create a new form
3. Get your form endpoint (looks like: https://formspree.io/f/YOUR_FORM_ID)
4. Update the form action in `contact.html` line 103:
   ```html
   <form id="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

### 2. Update Email Address

Replace placeholder email addresses with your actual email:
- Update `mia@fromtheashes.fit` throughout all HTML files

### 3. Analytics (Optional)

To track visitor statistics, add Google Analytics:

1. Sign up for [Google Analytics](https://analytics.google.com)
2. Create a new property for fromtheashes.fit
3. Get your tracking code
4. Add it to the `<head>` section of all HTML files

## File Structure

```
fromtheashes-site/
├── index.html          # Homepage
├── about.html          # About Mia page
├── services.html       # Services & pricing
├── programs.html       # Program descriptions
├── testimonials.html   # Client testimonials
├── contact.html        # Contact form & booking
├── CNAME              # Custom domain file
├── README.md          # This file
├── css/
│   └── styles.css     # All styling
├── js/
│   └── main.js        # JavaScript functionality
└── images/            # All website images
```

## Maintenance

### Updating Content

1. Edit the HTML files directly
2. Commit and push changes to GitHub:
   ```bash
   git add .
   git commit -m "Update description"
   git push
   ```
3. Changes will be live within minutes

### Adding Blog Posts

Consider using Jekyll (GitHub Pages' built-in static site generator) if you want to add a blog section in the future.

## Browser Support

The website supports:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Credits

- Design and Development: Custom built for From The Ashes Fitness
- Icons: Emoji icons used for simplicity
- Fonts: Google Fonts (Montserrat, Open Sans)

## Contact

For website issues or updates, please contact the developer.

## License

© 2024 From The Ashes Fitness. All rights reserved.