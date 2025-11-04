# 🔍 Audit Tools Dashboard - Streamlit Version

A professional audit tools dashboard built with **Streamlit** for easy deployment and hosting. This version provides all the functionality of the original React/Node.js application but in a Python-based framework perfect for Streamlit hosting.

## 🚀 Features

### ✅ **Core Functionality**
- **🔐 User Authentication**: Secure login/registration system with role-based access
- **📊 Dashboard**: Professional overview with metrics and featured tools
- **🔧 Tool Management**: Browse and launch audit tools with categories
- **📁 Project Management**: Save and organize audit results
- **⚙️ Admin Panel**: Complete administrative control over tools and users
- **📄 TDS Challan Extractor**: Advanced PDF data extraction tool

### 🎨 **Design Features**
- **anime.js-inspired design**: Clean, minimalist aesthetic
- **Responsive layout**: Works seamlessly on desktop, tablet, and mobile
- **Professional styling**: Consistent with modern design standards
- **Smooth animations**: Enhanced user experience

## 🛠️ Technology Stack

- **Frontend**: Streamlit (Python web framework)
- **Backend**: Python 3.8+
- **Database**: SQLite (lightweight, file-based)
- **PDF Processing**: PyMuPDF
- **Data Processing**: Pandas, NumPy
- **Authentication**: streamlit-authenticator
- **Styling**: Custom CSS with anime.js-inspired design

## 📋 Prerequisites

- **Python 3.8** or higher
- **pip** package manager

## 🚀 Quick Start

### 1. **Clone and Setup**
```bash
git clone <your-repository>
cd Excel_Tools
```

### 2. **Create Virtual Environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. **Install Dependencies**
```bash
pip install -r requirements.txt
```

### 4. **Run the Application**
```bash
streamlit run streamlit_app.py
```

The application will open in your browser at `http://localhost:8501`

### 5. **Default Admin Account**
- **Email**: admin@audittools.com
- **Password**: admin123

## 🌐 **Deployment Options**

### **Streamlit Cloud** (Recommended)
1. Upload your code to GitHub
2. Connect your GitHub account to [Streamlit Cloud](https://share.streamlit.io)
3. Select your repository and `streamlit_app.py`
4. Configure environment variables if needed
5. Deploy!

### **Heroku**
```bash
# Create Procfile
echo "web: streamlit run streamlit_app.py --server.port=$PORT --server.address=0.0.0.0" > Procfile

# Create runtime.txt
echo "python-3.9.16" > runtime.txt

# Deploy to Heroku
heroku create your-app-name
git push heroku main
```

### **PythonAnywhere**
1. Upload files to PythonAnywhere
2. Install requirements in virtual environment
3. Configure web app to run `streamlit run streamlit_app.py`
4. Set up custom domain if desired

### **VPS/Docker**
```bash
# Dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8501

CMD ["streamlit", "run", "streamlit_app.py", "--server.address=0.0.0.0"]
```

## 📁 **Project Structure**

```
Excel_Tools/
├── streamlit_app.py              # Main Streamlit application
├── requirements.txt              # Python dependencies
├── .streamlit/                   # Streamlit configuration
│   ├── config.toml              # Theme and server settings
│   └── secrets.toml.example     # Environment variables template
├── tools/                       # HTML tools (for iframe integration)
│   ├── tds_challan_extractor.html
│   └── sample_tool.html
├── README_STREAMLIT.md          # This file
└── audit_tools.db               # SQLite database (created automatically)
```

## 🔧 **Key Features Implementation**

### **Authentication System**
- Secure password hashing with SHA-256
- Session management with Streamlit
- Role-based access control (user/admin)
- Auto-creation of admin account

### **TDS Challan Extractor**
- Advanced PDF text extraction using PyMuPDF
- Intelligent data parsing with regex patterns
- Support for multiple file uploads
- CSV export functionality
- Project saving capabilities

### **Database Schema**
- **Users**: id, name, email, password, role, created_at
- **Tools**: id, name, description, category, icon, html_file, access_type
- **Projects**: id, user_id, tool_id, name, description, results, status

### **Tool Categories**
- **Security**: SSL checking, vulnerability scanning
- **Network**: Port scanning, network analysis
- **Data**: Data extraction, format conversion
- **Crypto**: Hash generation, encryption tools
- **Forensics**: Log analysis, data recovery

## 🎨 **Customization**

### **Adding New Tools**

1. **Create HTML Tool**:
   ```html
   <!-- tools/my_tool.html -->
   <!DOCTYPE html>
   <html>
   <head>
       <style>
           /* Use anime.js-inspired styling */
       </style>
   </head>
   <body>
       <!-- Your tool content -->
   </body>
   </html>
   ```

2. **Add to Database**:
   - Login as admin
   - Go to Admin Panel
   - Use "Add New Tool" form
   - Enter tool details and HTML filename

3. **For Python Tools**:
   - Create function in `streamlit_app.py`
   - Add to tool routing logic
   - Update database with `python_file` field

### **Styling Customization**

Edit the CSS in `streamlit_app.py` in the `load_css()` function:

```python
# Custom CSS variables
:root {
    --primary-color: "#007bff";
    --secondary-color: "#666666";
    --accent-color: "#007bff";
    # ... other variables
}
```

### **Theme Configuration**

Edit `.streamlit/config.toml` to customize:

```toml
[theme]
primaryColor = "#007bff"
backgroundColor = "#ffffff"
textColor = "#000000"
font = "sans serif"
```

## 🔒 **Security Features**

- **Password Hashing**: SHA-256 with salt
- **Session Management**: Secure Streamlit sessions
- **Input Validation**: Data validation and sanitization
- **File Upload Security**: Type and size restrictions
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Proper HTML escaping

## 📊 **Database Management**

### **View Database Contents**
```python
import sqlite3
conn = sqlite3.connect('audit_tools.db')
df = pd.read_sql_query("SELECT * FROM users", conn)
print(df)
```

### **Backup Database**
```python
import shutil
shutil.copy2('audit_tools.db', 'backup_audit_tools.db')
```

### **Reset Database**
```python
import os
if os.path.exists('audit_tools.db'):
    os.remove('audit_tools.db')
# Database will be recreated on next app run
```

## 🚀 **Performance Optimization**

### **Large File Handling**
- File size limits configured (200MB default)
- Progress indicators for long operations
- Memory-efficient PDF processing

### **Caching**
- Streamlit's built-in caching with `@st.cache_data`
- Database connection pooling
- Optimized queries

## 🐛 **Troubleshooting**

### **Common Issues**

1. **Module Import Errors**:
   ```bash
   pip install -r requirements.txt --upgrade
   ```

2. **PDF Processing Issues**:
   - Ensure PDF files are not password-protected
   - Check file size limits

3. **Database Errors**:
   - Delete `audit_tools.db` to recreate
   - Check file permissions

4. **Styling Issues**:
   - Clear browser cache
   - Check CSS syntax

### **Debug Mode**
Add to top of `streamlit_app.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch
3. Add your tool or improvement
4. Test thoroughly
5. Submit pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For issues or questions:
1. Check this README
2. Review the code comments
3. Test in development environment first
4. Create GitHub issue with details

---

## 🎉 **Ready to Deploy!**

Your Streamlit Audit Tools Dashboard is now ready for deployment!

**Next Steps:**
1. Test all features locally
2. Prepare your HTML tools
3. Deploy to your chosen platform
4. Share with your team!

**Benefits of Streamlit Version:**
- ✅ Easy deployment to Streamlit Cloud
- ✅ No backend server management
- ✅ Automatic HTTPS
- ✅ Built-in authentication
- ✅ Easy data visualization
- ✅ Perfect for data science workflows

**Deploy to Streamlit Cloud in minutes!** 🚀