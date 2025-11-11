import streamlit as st
import streamlit_authenticator as stauth
import pandas as pd
import sqlite3
import hashlib
import os
from datetime import datetime, timedelta
import base64
from PIL import Image
import io
import json
from pathlib import Path
from longcat_api import longcat_chat, LongCatAPIError

# Set page configuration
st.set_page_config(
    page_title="Audit Tools Dashboard",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for anime.js-inspired styling
def load_css():
    st.markdown("""
    <style>
        :root {
            --primary-color: #000000;
            --secondary-color: #666666;
            --accent-color: #007bff;
            --background-color: #ffffff;
            --surface-color: #f8f9fa;
            --border-color: #e0e0e0;
            --text-primary: #000000;
            --text-secondary: #666666;
            --text-muted: #999999;
            --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
            --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07);
            --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
            --border-radius: 6px;
            --border-radius-lg: 8px;
            --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .stApp {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;
        }

        .main-header {
            background-color: var(--background-color);
            border-bottom: 1px solid var(--border-color);
            padding: 1.5rem 0;
            margin-bottom: 2rem;
            box-shadow: var(--shadow-sm);
        }

        .tool-card {
            background-color: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-lg);
            padding: 2rem;
            margin-bottom: 1.5rem;
            transition: var(--transition);
            box-shadow: var(--shadow-sm);
        }

        .tool-card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--accent-color);
            transform: translateY(-2px);
        }

        .stats-card {
            background-color: var(--surface-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1.5rem;
            text-align: center;
        }

        .btn-primary {
            background-color: var(--accent-color);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: var(--border-radius);
            font-weight: 500;
            transition: var(--transition);
        }

        .btn-primary:hover {
            background-color: #0056b3;
        }

        .upload-area {
            border: 2px dashed var(--border-color);
            border-radius: var(--border-radius-lg);
            padding: 2rem;
            text-align: center;
            background-color: var(--surface-color);
            transition: var(--transition);
        }

        .upload-area:hover {
            border-color: var(--accent-color);
            box-shadow: var(--shadow-md);
        }

        .data-table {
            background-color: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius-lg);
            overflow: hidden;
        }

        .sidebar-header {
            background-color: var(--surface-color);
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            margin: -2rem -1rem 1.5rem -1rem;
        }

        .metric-card {
            background-color: var(--surface-color);
            padding: 1.5rem;
            border-radius: var(--border-radius);
            border-left: 4px solid var(--accent-color);
        }

        h1, h2, h3 {
            font-weight: 600;
            line-height: 1.3;
            color: var(--text-primary);
        }

        h1 {
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 1rem;
        }

        h2 {
            font-size: 2rem;
            font-weight: 600;
            letter-spacing: -0.01em;
            margin-bottom: 1.5rem;
        }

        h3 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
        }

        /* Streamlit specific overrides */
        .stSelectbox > div > div {
            background-color: var(--background-color);
            border-color: var(--border-color);
        }

        .stTextInput > div > div > input {
            background-color: var(--background-color);
            border-color: var(--border-color);
        }

        .stButton > button {
            background-color: var(--accent-color);
            color: white;
            border: none;
            border-radius: var(--border-radius);
            font-weight: 500;
            transition: var(--transition);
        }

        .stButton > button:hover {
            background-color: #0056b3;
            transform: translateY(-1px);
            box-shadow: var(--shadow-md);
        }

        .stDataFrame {
            background-color: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
        }

        .stSidebar .stButton > button {
            width: 100%;
            margin-bottom: 0.5rem;
        }

        /* Hide Streamlit default elements */
        .stDeployButton {
            display: none;
        }
    </style>
    """, unsafe_allow_html=True)

# Database initialization
def init_db():
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()

    # Users table
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tools table
    c.execute('''
        CREATE TABLE IF NOT EXISTS tools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            icon TEXT DEFAULT '🔧',
            python_file TEXT,
            html_file TEXT,
            access_type TEXT DEFAULT 'iframe',
            is_active BOOLEAN DEFAULT 1,
            added_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (added_by) REFERENCES users (id)
        )
    ''')

    # Projects table
    c.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tool_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            results TEXT,
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (tool_id) REFERENCES tools (id)
        )
    ''')

    # Check if admin user exists, create if not
    c.execute("SELECT * FROM users WHERE email = 'admin@audittools.com'")
    if not c.fetchone():
        hashed_password = hashlib.sha256("admin123".encode()).hexdigest()
        c.execute(
            "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
            ("Administrator", "admin@audittools.com", hashed_password, "admin")
        )

    # Add default tools if none exist
    c.execute("SELECT COUNT(*) FROM tools")
    if c.fetchone()[0] == 0:
        default_tools = [
            ("TDS Challan Extractor", "Extract financial data from TDS challan PDFs", "data", "📄", None, "tds_challan_extractor.html", "integrated"),
            ("AI Excel Analyzer", "Intelligent Excel data analysis with LongCat AI and Indian tax insights", "data", "📊", None, "ai_excel_analyzer.html", "integrated"),
            ("Sample Text Analyzer", "Analyze text for character count, words, etc.", "data", "📝", None, "sample_tool.html", "iframe"),
            ("Hash Generator", "Generate various hash types for files and text", "crypto", "#️⃣", None, "sample_tool.html", "iframe"),
            ("SSL Checker", "Check SSL certificate validity and configuration", "security", "🔒", None, "sample_tool.html", "iframe"),
        ]

        for tool in default_tools:
            c.execute(
                "INSERT INTO tools (name, description, category, icon, python_file, html_file, access_type) VALUES (?, ?, ?, ?, ?, ?, ?)",
                tool
            )

    conn.commit()
    conn.close()

# Authentication
def authenticate_user(email, password):
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    c.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, hashed_password))
    user = c.fetchone()
    conn.close()
    return user

def register_user(name, email, password):
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    try:
        c.execute("INSERT INTO users (name, email, password) VALUES (?, ?, ?)", (name, email, hashed_password))
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

# Get user data
def get_user(user_id):
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()
    c.execute("SELECT id, name, email, role FROM users WHERE id = ?", (user_id,))
    user = c.fetchone()
    conn.close()
    return user

# Get tools
def get_tools():
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()
    c.execute("SELECT * FROM tools WHERE is_active = 1 ORDER BY name")
    tools = c.fetchall()
    conn.close()
    return tools

# Get projects for user
def get_user_projects(user_id):
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()
    c.execute('''
        SELECT p.*, t.name as tool_name, t.icon
        FROM projects p
        JOIN tools t ON p.tool_id = t.id
        WHERE p.user_id = ?
        ORDER BY p.created_at DESC
    ''', (user_id,))
    projects = c.fetchall()
    conn.close()
    return projects

# Save project
def save_project(user_id, tool_id, name, description, results, status='completed'):
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()
    c.execute('''
        INSERT INTO projects (user_id, tool_id, name, description, results, status)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (user_id, tool_id, name, description, json.dumps(results), status))
    conn.commit()
    project_id = c.lastrowid
    conn.close()
    return project_id

# TDS Challan Extractor Functions
import fitz  # PyMuPDF
import re
from io import BytesIO

def extract_text_from_pdf(uploaded_file):
    try:
        pdf_document = fitz.open(stream=uploaded_file.read(), filetype="pdf")
        text = ""
        for page_num in range(pdf_document.page_count):
            page = pdf_document.load_page(page_num)
            text += page.get_text()
        pdf_document.close()
        return text
    except Exception as e:
        st.error(f"Error extracting text from PDF: {str(e)}")
        return None

def parse_challan_data(text):
    data = {
        'date_of_deposit': '',
        'bsr_code': '',
        'challan_no': '',
        'nature_of_payment': '',
        'amount': '',
        'tax': '',
        'surcharge': '',
        'cess': '',
        'interest': '',
        'penalty': '',
        'fee_234e': '',
        'tan': '',
        'assessment_year': ''
    }

    # Clean the text
    clean_text = re.sub(r'\s+', ' ', text).strip()

    # Extract patterns
    patterns = {
        'date_of_deposit': r'Date of Deposit[:\s]*(\d{2}[-/]\w{3}[-/]\d{4})',
        'bsr_code': r'BSR\s*code[:\s]*(\d{7})',
        'challan_no': r'Challan\s*(?:No|Number)[:\s]*(\d+)',
        'nature_of_payment': r'Nature of Payment[:\s]*([A-Z0-9]+)',
        'amount': r'Amount[:\s]*[₹]?\s*([\d,]+)',
        'tax': r'(?:A\s+)?Tax[:\s]*[₹]?\s*([\d,]+)',
        'surcharge': r'(?:B\s+)?Surcharge[:\s]*[₹]?\s*([\d,]+)',
        'cess': r'(?:C\s+)?Cess[:\s]*[₹]?\s*([\d,]+)',
        'interest': r'(?:D\s+)?Interest[:\s]*[₹]?\s*([\d,]+)',
        'penalty': r'(?:E\s+)?Penalty[:\s]*[₹]?\s*([\d,]+)',
        'fee_234e': r'(?:F\s+)?Fee under section 234E[:\s]*[₹]?\s*([\d,]+)',
        'tan': r'TAN[:\s]*([A-Z]{4}\d{5}[A-Z])',
        'assessment_year': r'Assessment Year[:\s]*(\d{4}-\d{2})'
    }

    for key, pattern in patterns.items():
        match = re.search(pattern, clean_text, re.IGNORECASE)
        if match:
            data[key] = match.group(1).replace(',', '')

    return data

# Main application
def main():
    load_css()
    init_db()

    # Session state initialization
    if 'user_id' not in st.session_state:
        st.session_state.user_id = None
    if 'page' not in st.session_state:
        st.session_state.page = 'login'

    # Navigation
    with st.sidebar:
        st.markdown('<div class="sidebar-header"><h1>🔍 Audit Tools</h1></div>', unsafe_allow_html=True)

        if st.session_state.user_id:
            user = get_user(st.session_state.user_id)
            st.write(f"Welcome, **{user[1]}**")

            if st.button("📊 Dashboard", key="nav_dashboard"):
                st.session_state.page = 'dashboard'
            if st.button("🔧 Tools", key="nav_tools"):
                st.session_state.page = 'tools'
            if st.button("📁 Projects", key="nav_projects"):
                st.session_state.page = 'projects'
            if st.button("👤 Profile", key="nav_profile"):
                st.session_state.page = 'profile'

            if user[3] == 'admin':
                if st.button("⚙️ Admin", key="nav_admin"):
                    st.session_state.page = 'admin'

            st.markdown("---")
            if st.button("🚪 Logout", key="nav_logout"):
                st.session_state.user_id = None
                st.session_state.page = 'login'
                st.rerun()

    # Page routing
    if not st.session_state.user_id:
        login_page()
    elif st.session_state.page == 'dashboard':
        dashboard_page()
    elif st.session_state.page == 'tools':
        tools_page()
    elif st.session_state.page == 'projects':
        projects_page()
    elif st.session_state.page == 'profile':
        profile_page()
    elif st.session_state.page == 'admin':
        admin_page()
    else:
        dashboard_page()

def login_page():
    st.markdown('<div class="main-header"><h1>Audit Tools Dashboard</h1><p style="font-size: 1.1rem; color: var(--text-secondary);">Professional audit tools for security and compliance</p></div>', unsafe_allow_html=True)

    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        st.markdown('<div class="tool-card"><h2 style="text-align: center;">Sign In</h2></div>', unsafe_allow_html=True)

        # Login form
        with st.form("login_form"):
            email = st.text_input("Email", placeholder="Enter your email")
            password = st.text_input("Password", type="password", placeholder="Enter your password")

            col_submit1, col_submit2, col_submit3 = st.columns([1, 2, 1])
            with col_submit2:
                submit_login = st.form_submit_button("Sign In", use_container_width=True)

            if submit_login:
                user = authenticate_user(email, password)
                if user:
                    st.session_state.user_id = user[0]
                    st.session_state.page = 'dashboard'
                    st.rerun()
                else:
                    st.error("Invalid email or password")

        st.markdown("---")
        st.markdown('<div class="tool-card"><h3 style="text-align: center;">New to Audit Tools?</h3></div>', unsafe_allow_html=True)

        # Registration form
        with st.form("register_form"):
            name = st.text_input("Full Name", placeholder="Enter your full name")
            reg_email = st.text_input("Email", placeholder="Enter your email")
            reg_password = st.text_input("Password", type="password", placeholder="Enter your password")
            confirm_password = st.text_input("Confirm Password", type="password", placeholder="Confirm your password")

            col_reg1, col_reg2, col_reg3 = st.columns([1, 2, 1])
            with col_reg2:
                submit_register = st.form_submit_button("Create Account", use_container_width=True)

            if submit_register:
                if reg_password != confirm_password:
                    st.error("Passwords do not match")
                elif len(reg_password) < 6:
                    st.error("Password must be at least 6 characters")
                else:
                    if register_user(name, reg_email, reg_password):
                        st.success("Account created successfully! Please sign in.")
                    else:
                        st.error("Email already exists")

def dashboard_page():
    st.markdown('<div class="main-header"><h1>Dashboard</h1><p style="color: var(--text-secondary);">Professional audit tools and insights</p></div>', unsafe_allow_html=True)

    # Stats
    tools = get_tools()
    projects = get_user_projects(st.session_state.user_id) if st.session_state.user_id else []

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.markdown('<div class="metric-card"><h3>{}</h3><p style="color: var(--text-secondary); font-size: 0.9rem;">Total Tools</p></div>'.format(len(tools)), unsafe_allow_html=True)
    with col2:
        st.markdown('<div class="metric-card"><h3>{}</h3><p style="color: var(--text-secondary); font-size: 0.9rem;">Your Projects</p></div>'.format(len(projects)), unsafe_allow_html=True)
    with col3:
        st.markdown('<div class="metric-card"><h3>{}</h3><p style="color: var(--text-secondary); font-size: 0.9rem;">Completed</p></div>'.format(len([p for p in projects if p[6] == 'completed'])), unsafe_allow_html=True)
    with col4:
        st.markdown('<div class="metric-card"><h3>{}</h3><p style="color: var(--text-secondary); font-size: 0.9rem;">In Progress</p></div>'.format(len([p for p in projects if p[6] == 'draft'])), unsafe_allow_html=True)

    # Featured tools
    st.markdown('<h2>🔧 Featured Tools</h2>', unsafe_allow_html=True)

    tools_cols = st.columns(3)
    for i, tool in enumerate(tools[:6]):
        with tools_cols[i % 3]:
            st.markdown(f'''
                <div class="tool-card">
                    <h3>{tool[4]} {tool[1]}</h3>
                    <p style="color: var(--text-secondary); margin: 1rem 0;">{tool[2]}</p>
                    <p style="font-size: 0.9rem; color: var(--text-muted); background: var(--surface-color); padding: 0.5rem; border-radius: var(--border-radius); display: inline-block;">{tool[3]}</p>
                </div>
            ''', unsafe_allow_html=True)

    # Recent projects
    if projects:
        st.markdown('<h2>📁 Recent Projects</h2>', unsafe_allow_html=True)

        projects_data = []
        for project in projects[:5]:
            projects_data.append({
                'Name': project[3],
                'Tool': project[7],
                'Status': project[6].title(),
                'Created': project[8][:10] if project[8] else 'N/A'
            })

        df = pd.DataFrame(projects_data)
        st.dataframe(df, use_container_width=True)

def tools_page():
    st.markdown('<div class="main-header"><h1>🔧 Audit Tools</h1><p style="color: var(--text-secondary);">Browse and launch professional audit tools</p></div>', unsafe_allow_html=True)

    tools = get_tools()
    categories = list(set(tool[3] for tool in tools))

    # Category filter
    selected_category = st.selectbox("Filter by Category", ["All"] + categories)

    # Search
    search_term = st.text_input("Search Tools", placeholder="Search for tools...")

    # Filter tools
    filtered_tools = tools
    if selected_category != "All":
        filtered_tools = [tool for tool in filtered_tools if tool[3] == selected_category]
    if search_term:
        filtered_tools = [tool for tool in filtered_tools if search_term.lower() in tool[1].lower() or search_term.lower() in tool[2].lower()]

    # Display tools
    cols = st.columns(3)
    for i, tool in enumerate(filtered_tools):
        with cols[i % 3]:
            if st.button(f"{tool[4]} {tool[1]}", key=f"tool_{tool[0]}", use_container_width=True):
                st.session_state.selected_tool = tool
                st.session_state.page = 'tool_detail'
                st.rerun()

def tds_challan_extractor_page():
    st.markdown('<div class="main-header"><h1>📄 TDS Challan Data Extractor</h1><p style="color: var(--text-secondary);">Extract financial data from TDS challan PDFs automatically</p></div>', unsafe_allow_html=True)

    # File upload
    st.markdown('<div class="upload-area">', unsafe_allow_html=True)
    uploaded_files = st.file_uploader("Upload TDS Challan PDFs", type=['pdf'], accept_multiple_files=True)
    st.markdown('</div>', unsafe_allow_html=True)

    if uploaded_files:
        st.write(f"**{len(uploaded_files)} files uploaded**")

        if st.button("🚀 Process Challans", use_container_width=True):
            with st.spinner("Processing PDFs... This may take a few minutes."):
                all_results = []

                for file in uploaded_files:
                    st.write(f"Processing: {file.name}")

                    # Extract text from PDF
                    text = extract_text_from_pdf(file)
                    if text:
                        # Parse data
                        data = parse_challan_data(text)
                        data['file_name'] = file.name
                        all_results.append(data)

                if all_results:
                    # Display results
                    df = pd.DataFrame(all_results)
                    st.success(f"Successfully processed {len(all_results)} files")

                    # Show data
                    st.markdown('<div class="data-table">', unsafe_allow_html=True)
                    st.dataframe(df, use_container_width=True)
                    st.markdown('</div>', unsafe_allow_html=True)

                    # Summary
                    total_amount = df['amount'].replace('', 0).astype(float).sum()
                    total_tax = df['tax'].replace('', 0).astype(float).sum()

                    col1, col2, col3 = st.columns(3)
                    with col1:
                        st.markdown(f'<div class="stats-card"><h3>{len(all_results)}</h3><p>Total Challans</p></div>', unsafe_allow_html=True)
                    with col2:
                        st.markdown(f'<div class="stats-card"><h3>₹{total_amount:,.2f}</h3><p>Total Amount</p></div>', unsafe_allow_html=True)
                    with col3:
                        st.markdown(f'<div class="stats-card"><h3>₹{total_tax:,.2f}</h3><p>Total Tax</p></div>', unsafe_allow_html=True)

                    # Export options
                    csv = df.to_csv(index=False)
                    st.download_button(
                        label="📥 Download CSV",
                        data=csv,
                        file_name=f"tds_challan_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                        mime="text/csv"
                    )

                    # Save to projects
                    if st.button("💾 Save to Projects"):
                        project_id = save_project(
                            st.session_state.user_id,
                            1,  # TDS tool ID
                            f"TDS Analysis - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                            f"Processed {len(uploaded_files)} TDS challan files",
                            all_results
                        )
                        st.success(f"Saved to projects with ID: {project_id}")
                else:
                    st.error("No data could be extracted from the uploaded files.")

    # Instructions
    with st.expander("📋 Instructions"):
        st.markdown("""
        1. **Upload PDF Files**: Select one or more TDS challan PDF files
        2. **Process**: Click the "Process Challans" button to extract data
        3. **Review**: Check the extracted data in the table below
        4. **Export**: Download the results as CSV or save to your projects

        **Supported Data Fields:**
        - Date of Deposit
        - BSR Code
        - Challan Number
        - Nature of Payment
        - Tax Breakup (Tax, Surcharge, Cess, Interest, Penalty)
        - TAN and Assessment Year
        """)

def ai_excel_analyzer_page():
    st.markdown('<div class="main-header"><h1>📊 AI Excel Analyzer</h1><p style="color: var(--text-secondary);">Intelligent Excel data analysis with LongCat AI and Indian taxation insights</p></div>', unsafe_allow_html=True)

    # File upload section
    st.markdown('<h3>📁 Upload Excel File</h3>', unsafe_allow_html=True)

    # File upload with validation
    st.markdown('<div class="upload-area">', unsafe_allow_html=True)
    uploaded_file = st.file_uploader(
        "Upload your Excel file",
        type=["xlsx", "xls"],
        key="excel_file_upload",
        help="Supported formats: .xlsx, .xls | Maximum size: 10MB"
    )
    st.markdown('</div>', unsafe_allow_html=True)

    # Session state for file data
    if 'excel_data' not in st.session_state:
        st.session_state.excel_data = None
    if 'excel_filename' not in st.session_state:
        st.session_state.excel_filename = None

    # Process uploaded file
    if uploaded_file is not None:
        # File validation
        if uploaded_file.size > 10 * 1024 * 1024:  # 10MB limit
            st.error("File size exceeds 10MB limit")
            return

        try:
            # Read Excel file
            df = pd.read_excel(uploaded_file)

            # Validate data
            if df.empty:
                st.error("The Excel file appears to be empty or has no readable data.")
                return

            # Store in session state
            st.session_state.excel_data = df
            st.session_state.excel_filename = uploaded_file.name

            # Display file info
            st.success(f"✅ File loaded successfully: {uploaded_file.name}")
            st.info(f"📊 {len(df)} rows, {len(df.columns)} columns")

            # Display data preview
            st.markdown('<h3>📋 Data Preview</h3>', unsafe_allow_html=True)
            st.markdown('<div class="data-table">', unsafe_allow_html=True)
            st.dataframe(df.head(10), use_container_width=True)
            st.markdown('</div>', unsafe_allow_html=True)

            # Column information
            with st.expander("📊 Column Information"):
                col_info = []
                for col in df.columns:
                    dtype = str(df[col].dtype)
                    non_null = df[col].count()
                    null_count = len(df) - non_null
                    unique_count = df[col].nunique()

                    col_info.append({
                        'Column': col,
                        'Data Type': dtype,
                        'Non-Null Values': non_null,
                        'Null Values': null_count,
                        'Unique Values': unique_count
                    })

                col_df = pd.DataFrame(col_info)
                st.dataframe(col_df, use_container_width=True)

        except Exception as e:
            st.error(f"Error reading Excel file: {str(e)}")
            return

    # Query section
    if st.session_state.excel_data is not None:
        st.markdown('<h3>💬 Ask About Your Data</h3>', unsafe_allow_html=True)

        # Query input with examples
        query_examples = [
            "What are the total expenses by category?",
            "Which expenses are tax-deductible under Indian law?",
            "Show me the top 5 highest values in the Amount column",
            "Analyze the payment patterns and identify any anomalies",
            "What are the compliance considerations for this data?"
        ]

        query = st.text_area(
            "Enter your question about the Excel data:",
            placeholder=f"Example: {query_examples[0]}",
            height=100,
            key="excel_query"
        )

        # Show examples in expander
        with st.expander("💡 Example Questions"):
            for example in query_examples:
                st.write(f"• {example}")

        # Analysis button
        if st.button("🔍 Analyze with LongCat AI", use_container_width=True, key="analyze_excel"):
            if not query or not query.strip():
                st.error("Please enter a question about your Excel data")
                return

            if len(query) > 1000:
                st.error("Question is too long. Please keep it under 1000 characters.")
                return

            # Prepare data for analysis
            df = st.session_state.excel_data
            sample_data = df.head(10).to_string(index=False)

            # Create summary statistics
            summary_stats = {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'columns': list(df.columns),
                'data_types': {col: str(dtype) for col, dtype in df.dtypes.items()},
                'numeric_columns': list(df.select_dtypes(include=['number']).columns),
                'text_columns': list(df.select_dtypes(include=['object']).columns)
            }

            # Construct the prompt for LongCat AI
            prompt = f"""
            You are a chartered accountant AI assistant specializing in data analysis and Indian taxation.
            Analyze the provided Excel data and answer the user's question with professional expertise.
            Reference relevant Indian Income Tax sections and Ind AS (Indian Accounting Standards) where applicable.
            Provide actionable insights and recommendations for tax optimization and compliance.

            Excel Data Context:
            - File: {st.session_state.excel_filename}
            - Columns: {', '.join(summary_stats['columns'])}
            - Data Types: {summary_stats['data_types']}
            - Sample data (first 10 rows):
            {sample_data}

            Summary Statistics:
            - Total Rows: {summary_stats['total_rows']}
            - Total Columns: {summary_stats['total_columns']}
            - Numeric Columns: {', '.join(summary_stats['numeric_columns'])}
            - Text Columns: {', '.join(summary_stats['text_columns'])}

            User Question: {query}

            Please provide:
            1. Direct answer to the user's question
            2. Relevant Indian tax sections (if applicable)
            3. Ind AS references (for accounting matters)
            4. Practical recommendations
            5. Risk considerations or compliance notes
            """

            # Show loading state
            with st.spinner("🤖 Analyzing with LongCat AI... This may take a moment."):
                try:
                    # Get AI response
                    ai_response = longcat_chat(prompt)

                    # Display results
                    st.markdown('<h3>🧠 AI Analysis Results</h3>', unsafe_allow_html=True)
                    st.markdown('<div class="tool-card">', unsafe_allow_html=True)
                    st.write(ai_response)
                    st.markdown('</div>', unsafe_allow_html=True)

                    # Export options
                    st.markdown('<h3>💾 Export Options</h3>', unsafe_allow_html=True)

                    col1, col2, col3 = st.columns(3)

                    with col1:
                        # Download data as CSV
                        csv = df.to_csv(index=False)
                        st.download_button(
                            label="📥 Download Excel Data (CSV)",
                            data=csv,
                            file_name=f"excel_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv",
                            mime="text/csv"
                        )

                    with col2:
                        # Download AI analysis
                        analysis_text = f"""
                        AI Excel Analysis Report
                        ========================

                        File: {st.session_state.excel_filename}
                        Query: {query}
                        Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

                        AI Response:
                        {ai_response}
                        """
                        st.download_button(
                            label="📄 Download Analysis Report",
                            data=analysis_text,
                            file_name=f"analysis_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt",
                            mime="text/plain"
                        )

                    with col3:
                        # Save to projects
                        if st.button("💾 Save to Projects", key="save_analysis"):
                            project_data = {
                                'file_name': st.session_state.excel_filename,
                                'query': query,
                                'response': ai_response,
                                'data_summary': summary_stats,
                                'sample_data': sample_data,
                                'analysis_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                            }

                            try:
                                # Get tool ID for AI Excel Analyzer (assuming it's the second tool)
                                conn = sqlite3.connect('audit_tools.db')
                                c = conn.cursor()
                                c.execute("SELECT id FROM tools WHERE name = 'AI Excel Analyzer'")
                                tool_result = c.fetchone()
                                tool_id = tool_result[0] if tool_result else 2
                                conn.close()

                                project_id = save_project(
                                    st.session_state.user_id,
                                    tool_id,
                                    f"Excel Analysis - {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                                    f"Analyzed {st.session_state.excel_filename} with query: {query[:100]}...",
                                    project_data
                                )
                                st.success(f"✅ Saved to projects with ID: {project_id}")
                            except Exception as e:
                                st.error(f"Error saving to projects: {str(e)}")

                except LongCatAPIError as e:
                    st.error(f"AI Service Error: {str(e)}")
                    st.info("Please try again in a few moments. If the problem persists, contact the administrator.")
                except Exception as e:
                    st.error(f"Unexpected error: {str(e)}")
                    st.info("Please try again. If the problem continues, contact support.")

    else:
        # Instructions when no file is uploaded
        st.markdown('<div class="tool-card" style="text-align: center;">', unsafe_allow_html=True)
        st.markdown('<h3>📊 How to Use AI Excel Analyzer</h3>', unsafe_allow_html=True)
        st.markdown('''
        <div style="text-align: left; margin-top: 1rem;">
        <h4>📋 Steps:</h4>
        <ol>
            <li><strong>Upload Excel File:</strong> Click the upload area above and select your Excel file (.xlsx or .xls)</li>
            <li><strong>Review Data:</strong> Check the data preview to ensure your file loaded correctly</li>
            <li><strong>Ask Questions:</strong> Type your question about the data in the query box</li>
            <li><strong>Get Analysis:</strong> Click "Analyze with LongCat AI" to get professional insights</li>
            <li><strong>Export Results:</strong> Download data, analysis reports, or save to projects</li>
        </ol>

        <h4>💡 Example Questions:</h4>
        <ul>
            <li>"What are the total expenses by category?"</li>
            <li>"Which expenses are tax-deductible under Indian law?"</li>
            <li>"Analyze payment patterns and identify anomalies"</li>
            <li>"What are the compliance considerations for this data?"</li>
        </ul>

        <h4>🏛️ Expertise Areas:</h4>
        <ul>
            <li>Indian Income Tax Act sections and compliance</li>
            <li>Ind AS (Indian Accounting Standards)</li>
            <li>Tax deduction and optimization strategies</li>
            <li>Financial data analysis and reporting</li>
            <li>Risk assessment and compliance requirements</li>
        </ul>
        </div>
        ''', unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

def projects_page():
    st.markdown('<div class="main-header"><h1>📁 Your Projects</h1><p style="color: var(--text-secondary);">Manage your audit projects and results</p></div>', unsafe_allow_html=True)

    projects = get_user_projects(st.session_state.user_id)

    if not projects:
        st.markdown('<div class="tool-card" style="text-align: center;"><h3>No projects yet</h3><p style="color: var(--text-secondary);">Start using tools to create your first project!</p></div>', unsafe_allow_html=True)
    else:
        # Project stats
        completed = len([p for p in projects if p[6] == 'completed'])
        draft = len([p for p in projects if p[6] == 'draft'])

        col1, col2 = st.columns(2)
        with col1:
            st.markdown(f'<div class="stats-card"><h3>{completed}</h3><p>Completed Projects</p></div>', unsafe_allow_html=True)
        with col2:
            st.markdown(f'<div class="stats-card"><h3>{draft}</h3><p>Draft Projects</p></div>', unsafe_allow_html=True)

        # Projects list
        for project in projects:
            with st.expander(f"📄 {project[3]} - {project[7]}"):
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.write(f"**Description:** {project[4] or 'No description'}")
                    st.write(f"**Status:** {project[6].title()}")
                    st.write(f"**Created:** {project[8]}")
                with col2:
                    if project[5]:  # Results
                        if st.button(f"📊 View Results", key=f"view_{project[0]}"):
                            results = json.loads(project[5])
                            st.json(results)

def profile_page():
    st.markdown('<div class="main-header"><h1>👤 Profile Settings</h1><p style="color: var(--text-secondary);">Manage your account settings and preferences</p></div>', unsafe_allow_html=True)

    user = get_user(st.session_state.user_id)

    col1, col2 = st.columns([2, 1])
    with col1:
        st.markdown('<div class="tool-card">', unsafe_allow_html=True)
        st.subheader("Account Information")
        st.write(f"**Name:** {user[1]}")
        st.write(f"**Email:** {user[2]}")
        st.write(f"**Role:** {user[3].title()}")
        st.write(f"**Member Since:** {user[0]}")  # This would need to be updated with actual date
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="tool-card">', unsafe_allow_html=True)
        st.subheader("Statistics")
        projects = get_user_projects(st.session_state.user_id)
        st.write(f"**Total Projects:** {len(projects)}")
        st.write(f"**Completed:** {len([p for p in projects if p[6] == 'completed'])}")
        st.markdown('</div>', unsafe_allow_html=True)

def admin_page():
    st.markdown('<div class="main-header"><h1>⚙️ Admin Panel</h1><p style="color: var(--text-secondary);">Manage tools, users, and system settings</p></div>', unsafe_allow_html=True)

    # Admin stats
    tools = get_tools()
    conn = sqlite3.connect('audit_tools.db')
    c = conn.cursor()
    c.execute("SELECT COUNT(*) FROM users")
    user_count = c.fetchone()[0]
    c.execute("SELECT COUNT(*) FROM projects")
    project_count = c.fetchone()[0]
    conn.close()

    col1, col2, col3 = st.columns(3)
    with col1:
        st.markdown(f'<div class="stats-card"><h3>{user_count}</h3><p>Total Users</p></div>', unsafe_allow_html=True)
    with col2:
        st.markdown(f'<div class="stats-card"><h3>{len(tools)}</h3><p>Total Tools</p></div>', unsafe_allow_html=True)
    with col3:
        st.markdown(f'<div class="stats-card"><h3>{project_count}</h3><p>Total Projects</p></div>', unsafe_allow_html=True)

    # Tool management
    st.subheader("🔧 Tool Management")

    # Add new tool form
    with st.expander("Add New Tool"):
        with st.form("add_tool"):
            tool_name = st.text_input("Tool Name")
            tool_description = st.text_area("Description")
            tool_category = st.selectbox("Category", ["security", "network", "data", "crypto", "forensics", "other"])
            tool_icon = st.text_input("Icon (Emoji)", value="🔧")
            tool_file = st.text_input("HTML File Name", placeholder="tool.html")

            submit_tool = st.form_submit_button("Add Tool")

            if submit_tool:
                conn = sqlite3.connect('audit_tools.db')
                c = conn.cursor()
                c.execute(
                    "INSERT INTO tools (name, description, category, icon, html_file, added_by) VALUES (?, ?, ?, ?, ?, ?)",
                    (tool_name, tool_description, tool_category, tool_icon, tool_file, st.session_state.user_id)
                )
                conn.commit()
                conn.close()
                st.success("Tool added successfully!")
                st.rerun()

    # List tools
    st.subheader("Current Tools")
    tools_data = []
    for tool in tools:
        tools_data.append({
            'ID': tool[0],
            'Name': tool[1],
            'Category': tool[3],
            'Icon': tool[4],
            'Active': 'Yes' if tool[7] else 'No'
        })

    df = pd.DataFrame(tools_data)
    st.dataframe(df, use_container_width=True)

# Check for tool detail page
if 'selected_tool' in st.session_state and st.session_state.selected_tool:
    tool = st.session_state.selected_tool
    if tool[1] == "TDS Challan Extractor":
        tds_challan_extractor_page()
    elif tool[1] == "AI Excel Analyzer":
        ai_excel_analyzer_page()
    else:
        st.markdown(f'<div class="main-header"><h1>{tool[4]} {tool[1]}</h1><p>{tool[2]}</p></div>', unsafe_allow_html=True)
        st.info("This tool is being prepared for launch. For now, please use the TDS Challan Extractor above.")
        if st.button("← Back to Tools"):
            st.session_state.page = 'tools'
            del st.session_state.selected_tool
            st.rerun()
else:
    main()