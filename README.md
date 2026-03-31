Amazon-sales-intelligence
# 🛒 Amazon Sales Intelligence Platform

An open-source, client-side React analytics dashboard designed to help D2C founders, marketers, and e-commerce operators visualize complex Amazon Business Reports without the need for expensive SaaS wrappers or backend databases.

![Dashboard Preview](https://drive.google.com/file/d/11xUjvO472eKfghQo_GEhm72EMhdEHmHo/view) 

## 🚀 The Problem It Solves

Amazon Seller Central provides robust data, but exporting and analyzing "Detail Page Sales and Traffic by Child Item" reports often requires hours of spreadsheet gymnastics. This project eliminates that friction. 

By utilizing client-side CSV parsing, this dashboard instantly ingests raw Amazon reports, cross-references them with your custom SKU mapping, and generates actionable, month-over-month visual insights—all entirely within the browser.

## ✨ Key Features

* **⚡ Zero-Latency Client-Side Parsing:** Uses `papaparse` to process heavy CSV datasets directly in the browser. No backend servers, no database latency, and no data privacy concerns.
* **🔒 Secure "Demo Mode" Architecture:** Includes a custom-engineered data obfuscation layer. When activated, it masks proprietary ASINs/SKUs and mathematically scales revenue figures (3x multiplier), allowing you to safely showcase your analytics capabilities publicly.
* **📈 Comparative Analytics:** Dynamic state management allows for instant month-over-month benchmarking, highlighting "Rising Star" products, conversion rate shifts, and overall revenue growth.
* **🗂️ Intelligent SKU Mapping:** Automatically groups messy, SEO-optimized Amazon product titles into clean, readable categories and bundles for accurate high-level reporting.

## 🛠️ Tech Stack

This project was built using modern frontend technologies and AI-assisted "vibecoding":

* **Framework:** React + Vite
* **Styling:** Tailwind CSS
* **Components:** Shadcn UI (accessible, customizable components)
* **Data Visualization:** Recharts
* **Data Ingestion:** PapaParse (for CSV handling)
* **Icons:** Lucide React

## 🚦 Getting Started

To run this dashboard locally:

### 1. Clone the repository
```bash
git clone [https://github.com/ainavodit-create/Amazon-sales-intelligence.git](https://github.com/ainavodit-create/Amazon-sales-intelligence.git)
2. Install dependencies
Bash
cd Amazon-sales-intelligence
npm install
3. Start the development server
Bash
npm run dev
🔐 Using Demo Mode
This platform includes a built-in Demo Mode to protect sensitive business data.

By default, the app boots into isDemoMode = true, displaying obfuscated SKUs and scaled metrics.

To view real data, click the "Encrypt" / Lock icon in the top right navigation.

(Default Admin Credentials can be configured in the auth state).

🤝 Contributing
This project is open-source and intended to empower independent e-commerce builders. Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

👨‍💻 About the Creator
Built by Navodit Ravi, transitioning from 14 years in Retention Marketing to building production-grade e-commerce tools via AI-assisted development.
