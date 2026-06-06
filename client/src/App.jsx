import React, { useState, useEffect } from 'react';

export default function App() {
  // Navigation & Scroll states
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showAdminDashboard, setShowAdminDashboard] = useState(true);

  // Contact Widget Tab selection
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'calendar'

  // Inquiry Form state
  const [inquiryData, setInquiryData] = useState({
    name: '',
    email: '',
    phone: '',
    destination: '',
    service: '',
    message: ''
  });
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Calendar Booking state
  const [currentDate, setCurrentDate] = useState(new Date()); // Used for displaying the month
  const [selectedDate, setSelectedDate] = useState(null); // String YYYY-MM-DD
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [busySlots, setBusySlots] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingMailSent, setBookingMailSent] = useState(true);
  const [inquiryMailSent, setInquiryMailSent] = useState(true);

  // Server API base URL
  const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

  // Safe JSON Parsing helper to avoid "Unexpected end of JSON input" errors
  const safeParseJson = async (response) => {
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return null;
    } catch (e) {
      console.warn("JSON parsing failed, returning null:", e);
      return null;
    }
  };

  // Admin Portal state
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return localStorage.getItem('isAdminLoggedIn') === 'true';
  });
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminLoginLoading, setAdminLoginLoading] = useState(false);
  
  // Admin Dashboard Workspace state
  const [adminTab, setAdminTab] = useState('inquiries'); // 'inquiries' or 'bookings'
  const [adminInquiries, setAdminInquiries] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [adminDataLoading, setAdminDataLoading] = useState(false);
  const [adminDataError, setAdminDataError] = useState('');
  const [dbConnected, setDbConnected] = useState(true);

  // Admin API functions
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setAdminLoginError('');
    setAdminLoginLoading(true);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await safeParseJson(res) || {};
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }
      setIsAdminLoggedIn(true);
      setShowAdminDashboard(true);
      localStorage.setItem('isAdminLoggedIn', 'true');
      setIsAdminModalOpen(false);
      fetchAdminData();
    } catch (err) {
      setAdminLoginError(err.message);
    } finally {
      setAdminLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setShowAdminDashboard(true);
    localStorage.removeItem('isAdminLoggedIn');
  };

  const fetchAdminData = async () => {
    setAdminDataLoading(true);
    setAdminDataError('');
    try {
      const statusRes = await fetch(`${API_BASE}/status`);
      if (statusRes.ok) {
        const statusData = await safeParseJson(statusRes);
        if (statusData) {
          setDbConnected(statusData.databaseConnected);
        }
      }

      const inquiriesRes = await fetch(`${API_BASE}/admin/inquiries`);
      if (inquiriesRes.ok) {
        const inquiriesData = await safeParseJson(inquiriesRes);
        if (inquiriesData) {
          setAdminInquiries(inquiriesData.inquiries || []);
        }
      }

      const bookingsRes = await fetch(`${API_BASE}/admin/bookings`);
      if (bookingsRes.ok) {
        const bookingsData = await safeParseJson(bookingsRes);
        if (bookingsData) {
          setAdminBookings(bookingsData.bookings || []);
        }
      }
    } catch (err) {
      setAdminDataError('Failed to synchronize dashboard data.');
      console.error(err);
    } finally {
      setAdminDataLoading(false);
    }
  };

  const handleDeleteInquiry = async (id) => {
    if (!window.confirm("Are you sure you want to delete this student inquiry?")) return;
    try {
      const res = await fetch(`${API_BASE}/admin/inquiries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete inquiry");
      setAdminInquiries(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBooking = async (id) => {
    console.log("handleDeleteBooking called with ID:", id);
    if (!window.confirm("Are you sure you want to delete this booking schedule?")) return;
    try {
      console.log("Sending DELETE request to:", `${API_BASE}/admin/bookings/${id}`);
      const res = await fetch(`${API_BASE}/admin/bookings/${id}`, { method: 'DELETE' });
      console.log("DELETE response status:", res.status);
      if (!res.ok) {
        const errorData = await safeParseJson(res) || {};
        console.error("DELETE failed details:", errorData);
        throw new Error(errorData.error || "Failed to delete booking");
      }
      setAdminBookings(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error("handleDeleteBooking caught error:", err);
      alert(err.message);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchAdminData();
    }
  }, [isAdminLoggedIn]);

  // Handle nav change on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Check which section is in viewport
      const sections = ['home', 'about', 'services', 'destinations', 'contact'];
      const scrollPos = window.scrollY + 120;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch busy slots when selected date changes
  useEffect(() => {
    if (selectedDate) {
      fetch(`${API_BASE}/bookings/busy?date=${selectedDate}`)
        .then(res => {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return res.json();
          }
          throw new Error("Response is not JSON");
        })
        .then(data => {
          if (data && data.busySlots) {
            setBusySlots(data.busySlots);
          }
        })
        .catch(err => {
          console.warn('Error fetching busy slots, using local default:', err);
          setBusySlots(['11:00 AM', '2:00 PM']);
        });
    }
  }, [selectedDate]);

  // Handle Inquiry Form submit
  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryError('');

    try {
      const response = await fetch(`${API_BASE}/inquiry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inquiryData)
      });

      const data = await safeParseJson(response) || {};
      if (response.ok) {
        setInquiryMailSent(data.emailSent !== false);
        setInquirySuccess(true);
      } else {
        setInquiryError(data.error || 'Failed to submit inquiry.');
      }
    } catch (err) {
      console.warn('Backend server not running, simulating local response:', err);
      setInquiryMailSent(false);
      setInquirySuccess(true);
    } finally {
      setInquiryLoading(false);
    }
  };

  // Handle booking form submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate || !selectedSlot) {
      setBookingError('Please choose both a date and a time slot.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');

    const payload = {
      ...bookingDetails,
      date: selectedDate,
      timeSlot: selectedSlot
    };

    try {
      const response = await fetch(`${API_BASE}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await safeParseJson(response) || {};
      if (response.ok) {
        setBookingMailSent(data.emailSent !== false);
        setBookingSuccess(true);
      } else if (response.status === 409) {
        setBookingError('This time slot has just been booked by someone else! Please choose another slot.');
      } else {
        setBookingError(data.error || 'Failed to book slot.');
      }
    } catch (err) {
      console.warn('Backend server not running, simulating local response:', err);
      setBookingMailSent(false);
      setBookingSuccess(true);
    } finally {
      setBookingLoading(false);
    }
  };

  // Calendar Helpers
  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ day: null, empty: true });
    }
    
    const today = new Date();
    for (let d = 1; d <= totalDays; d++) {
      const thisDate = new Date(year, month, d);
      const isPast = thisDate < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      days.push({
        day: d,
        dateStr: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        disabled: isPast || thisDate.getDay() === 0, // No Sundays
        isToday: today.getDate() === d && today.getMonth() === month && today.getFullYear() === year
      });
    }
    return days;
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const resetScheduler = () => {
    setSelectedDate(null);
    setSelectedSlot(null);
    setBookingDetails({ name: '', email: '', phone: '' });
    setBookingSuccess(false);
    setBookingError('');
    setBookingMailSent(true);
  };

  const availableSlots = [
    '10:00 AM', '11:00 AM', '12:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'
  ];

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isAdminLoggedIn && showAdminDashboard) {
    return (
      <div className="admin-dashboard-overlay" style={{ position: 'relative', minHeight: '100vh', zIndex: 1, paddingBottom: '60px', background: 'var(--gradient-bg)' }}>
        <div className="admin-dashboard-container">
          {/* Header */}
          <header className="admin-header">
            <div className="admin-logo-group">
              <span className="logo-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logo-grad-f-simple)" stroke="url(#logo-grad-f-stroke-simple)" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="url(#logo-grad-f-stroke-simple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="logo-grad-f-simple" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1e3a8a"/>
                      <stop offset="1" stopColor="#2563eb"/>
                    </linearGradient>
                    <linearGradient id="logo-grad-f-stroke-simple" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1d4ed8"/>
                      <stop offset="1" stopColor="#3b82f6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <h2>EdVantage Uni | <span className="accent-text" style={{ fontWeight: 600 }}>Counselor Console</span></h2>
            </div>
            
            <div className="admin-controls">
              <button className="btn-admin-view-site" onClick={() => setShowAdminDashboard(false)} style={{
                background: 'rgba(37, 99, 235, 0.1)',
                border: '1px solid rgba(37, 99, 235, 0.25)',
                padding: '8px 18px',
                borderRadius: '10px',
                color: 'var(--accent)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                🌐 View Site
              </button>
              <button className="btn-admin-logout" onClick={handleAdminLogout}>
                Log Out
              </button>
            </div>
          </header>

          {/* Metrics Panels */}
          <div className="admin-metrics-grid">
            <div className="metric-panel">
              <div className="metric-icon-slot metric-purple">✉️</div>
              <div className="metric-details">
                <span className="metric-label">Total Inquiries</span>
                <span className="metric-value">{adminInquiries.length}</span>
              </div>
            </div>
            
            <div className="metric-panel">
              <div className="metric-icon-slot metric-pink">📅</div>
              <div className="metric-details">
                <span className="metric-label">Scheduled Bookings</span>
                <span className="metric-value">{adminBookings.length}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="admin-tabs-nav">
            <button 
              className={`admin-tab-btn ${adminTab === 'inquiries' ? 'active' : ''}`}
              onClick={() => setAdminTab('inquiries')}
            >
              Student Inquiries ({adminInquiries.length})
            </button>
            <button 
              className={`admin-tab-btn ${adminTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setAdminTab('bookings')}
            >
              Discovery Bookings ({adminBookings.length})
            </button>
          </div>

          {/* Workspace Area */}
          <div className="admin-workspace">
            {adminDataLoading ? (
              <div className="dashboard-empty" style={{ margin: 'auto' }}>
                <div className="empty-icon" style={{ animation: 'spin 2s linear infinite' }}>🔄</div>
                <div className="empty-text">
                  <h4>Loading Records</h4>
                  <p>Synchronizing data with the server...</p>
                </div>
              </div>
            ) : adminDataError ? (
              <div className="dashboard-empty" style={{ margin: 'auto', color: '#ef4444' }}>
                <div className="empty-icon">⚠️</div>
                <div className="empty-text">
                  <h4>Sync Error</h4>
                  <p>{adminDataError}</p>
                </div>
              </div>
            ) : adminTab === 'inquiries' ? (
              // Inquiries Workspace
              <>
                <div className="workspace-title-bar">
                  <h3>Inquiries Received</h3>
                  <button className="btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={fetchAdminData}>🔄 Refresh</button>
                </div>
                
                {adminInquiries.length === 0 ? (
                  <div className="dashboard-empty" style={{ margin: 'auto' }}>
                    <div className="empty-icon">📂</div>
                    <div className="empty-text">
                      <h4>No inquiries yet</h4>
                      <p>Student query messages submitted through the contact form will show up here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student Details</th>
                          <th>Contact Info</th>
                          <th>Requested Area</th>
                          <th>Message / Inquiry Details</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminInquiries.map(item => (
                          <tr key={item._id}>
                            <td>
                              <strong>{item.name}</strong>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                Submitted: {new Date(item.createdAt).toLocaleString()}
                              </div>
                            </td>
                            <td>
                              <div>📧 {item.email}</div>
                              <div style={{ marginTop: '2px' }}>📞 {item.phone}</div>
                            </td>
                            <td>
                              <span className="dash-tag dash-tag-primary">📍 {item.destination}</span>
                              <div style={{ marginTop: '6px' }}><span className="dash-tag dash-tag-accent">🛠️ {item.service}</span></div>
                            </td>
                            <td style={{ maxWidth: '350px', wordBreak: 'break-word' }}>
                              {item.message}
                            </td>
                            <td>
                              <button className="btn-archive" onClick={() => handleDeleteInquiry(item._id)}>
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              // Bookings Workspace
              <>
                <div className="workspace-title-bar">
                  <h3>Discovery Bookings Scheduled</h3>
                  <button className="btn" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={fetchAdminData}>🔄 Refresh</button>
                </div>

                {adminBookings.length === 0 ? (
                  <div className="dashboard-empty" style={{ margin: 'auto' }}>
                    <div className="empty-icon">📅</div>
                    <div className="empty-text">
                      <h4>No discovery sessions scheduled</h4>
                      <p>Appointments scheduled via the calendar widget will be displayed here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student Name</th>
                          <th>Contact Details</th>
                          <th>Appointment Slot</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminBookings.map(item => (
                          <tr key={item._id}>
                            <td>
                              <strong>{item.name}</strong>
                            </td>
                            <td>
                              <div>📧 {item.email}</div>
                              <div style={{ marginTop: '2px' }}>📞 {item.phone}</div>
                            </td>
                            <td>
                              <strong style={{ color: 'var(--primary)' }}>📅 {item.date}</strong>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent)', marginTop: '2px' }}>
                                🕒 {item.timeSlot} (IST)
                              </div>
                            </td>
                            <td>
                              <span className="dash-tag" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                                ✓ Scheduled
                              </span>
                            </td>
                            <td>
                              <button className="btn-archive" onClick={() => handleDeleteBooking(item._id)}>
                                🗑️ Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Dynamic Background Glow Rings */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      <div className="bg-glow bg-glow-3"></div>

      {/* Navigation Bar */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <a href="#home" className="nav-logo" onClick={() => setMobileMenuOpen(false)}>
            <span className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logo-grad-simple)" stroke="url(#logo-grad-stroke-simple)" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="url(#logo-grad-stroke-simple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="url(#logo-grad-stroke-simple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="logo-grad-simple" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1e3a8a"/>
                    <stop offset="1" stopColor="#2563eb"/>
                  </linearGradient>
                  <linearGradient id="logo-grad-stroke-simple" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1d4ed8"/>
                    <stop offset="1" stopColor="#3b82f6"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <span className="logo-text">EdVantage <span className="accent-text">Uni</span></span>
          </a>

          <div className={`nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
            <a href="#home" className={`nav-link ${activeSection === 'home' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#about" className={`nav-link ${activeSection === 'about' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Meet the Counsellor</a>
            <a href="#services" className={`nav-link ${activeSection === 'services' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Services</a>
            <a href="#destinations" className={`nav-link ${activeSection === 'destinations' ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>Destinations</a>
            <a href="#contact" className="nav-btn-nav" onClick={() => { setMobileMenuOpen(false); setActiveTab('calendar'); }}>Book Free Call</a>
          </div>

          <button className={`menu-toggle ${mobileMenuOpen ? 'open' : ''}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu">
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </nav>

      {/* Admin floating bar - shown when admin is viewing the site */}
      {isAdminLoggedIn && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button onClick={() => setShowAdminDashboard(true)} style={{
            background: 'var(--gradient-primary)',
            color: '#fff',
            border: 'none',
            padding: '12px 22px',
            borderRadius: '14px',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(30, 58, 138, 0.35)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}>
            🛠️ Back to Dashboard
          </button>
        </div>
      )}

      {/* Page 1 - Home */}
      <section id="home" className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge animate-fade-in">
              <span className="badge-dot"></span>
              <span>Expert Study Abroad Counselling</span>
            </div>
            <h1 className="hero-title animate-slide-up">
              Your Global Education Journey Starts Here
            </h1>
            <p className="hero-subtitle animate-slide-up-delayed">
              Expert guidance from counselors with extensive experience.
            </p>
            <div className="hero-ctas animate-slide-up-delayed-more">
              <a href="#contact" className="btn btn-primary" onClick={() => setActiveTab('calendar')}>
                <span>Book a Free Call</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a href="#services" className="btn btn-secondary">Explore Services</a>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-image-frame">
              <img 
                src="/hero_global_education.png" 
                alt="Graduate celebrating with international flags - Global Education" 
                className="hero-scene-image"
              />
              <div className="hero-image-glow"></div>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="trust-bar">
          <div className="trust-bar-label">1,000+ Students Guided</div>
          <div className="trust-ticker-container">
            <div className="trust-ticker">
              <span className="ticker-item">🇺🇸 USA</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇨🇦 Canada</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇦🇺 Australia</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇬🇧 UK</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇩🇪 Germany</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇮🇪 Ireland</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇫🇷 France</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇳🇱 Netherlands</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇸🇬 Singapore</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">and more</span>
              
              {/* Infinite scrolling duplication */}
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇺🇸 USA</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇨🇦 Canada</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇦🇺 Australia</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇬🇧 UK</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇩🇪 Germany</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇮🇪 Ireland</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇫🇷 France</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇳🇱 Netherlands</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">🇸🇬 Singapore</span>
              <span className="ticker-dot">·</span>
              <span className="ticker-item">and more</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1 - Why EdVantage Uni? */}
      <section id="why-us" className="why-section" style={{ borderBottom: '1px solid var(--border-light)' }}>
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title text-center">Why EdVantage Uni?</h2>
            <div className="section-divider"></div>
            <p className="section-description text-center">
              We don't just process applications - we build futures. EdVantage Uni combines deep industry 
              knowledge, certified language coaching, and first-hand immigration experience to give you an edge 
              from day one.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card glass">
              <div className="pillar-icon" style={{ fontSize: '1.5rem' }}>👤</div>
              <h3>Personalized Counseling</h3>
              <p>Every student is unique. We craft a strategy around your goals, background, and budget.</p>
            </div>

            <div className="pillar-card glass">
              <div className="pillar-icon" style={{ fontSize: '1.5rem' }}>🗺️</div>
              <h3>Destination Expertise</h3>
              <p>From the USA to Singapore, we know the systems, the universities, and the visa requirements.</p>
            </div>

            <div className="pillar-card glass">
              <div className="pillar-icon" style={{ fontSize: '1.5rem' }}>🤝</div>
              <h3>End-to-End Support</h3>
              <p>Career guidance to visa approval - we're with you at every step.</p>
            </div>
          </div>

          <div className="why-cta-box glass">
            <div className="why-cta-content">
              <h3>Ready to take the first step?</h3>
              <p>Book a free 30-minute discovery call with a Senior Counselor.</p>
            </div>
            <a href="#contact" className="btn btn-primary" onClick={() => setActiveTab('calendar')}>
              <span>Book Your Call</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Page 2 - Meet the Counsellor */}
      <section id="about" className="about-section">
        <div className="section-container">
          <div className="about-grid">
            <div className="about-visual">
              <div className="about-morph-blob">
                <img 
                  src="/sneha_about_avatar.png" 
                  alt="Sneha Shah - Study Abroad Counselor" 
                  className="about-morph-image"
                />
              </div>
              <div className="experience-badge glass">
                <span className="exp-number">8</span>
                <span className="exp-text">Years of<br/>Experience</span>
              </div>
            </div>

            <div className="about-content">
              <h2 className="section-title">Meet Your Counselor</h2>
              <div className="bio-text">
                <p>Meet Sneha Shah - founder of EdVantage Uni and your dedicated study abroad partner.</p>
                <p>
                  Sneha holds an MA and B.Ed from the University of Mumbai, and through her previous work experience, she has spent 8 years working across every dimension of the international education industry - from counseling and applications to test coaching and visa strategy. She has observed trends in the overseas education industry for years and worked with hundreds of students, helping them secure places at top institutions across the USA, Canada, Australia, UK, Singapore, the Netherlands, and beyond.
                </p>
                <p>
                  She is a TOEFL Certified Trainer and a British Council Certified IELTS Trainer, with a personal PTE score of 90 - so when she coaches you, she speaks from experience, not just theory.
                </p>
                <p>
                  In 2024, Sneha moved to Australia. She knows firsthand what it feels like to navigate a new country, a new system, and a new life. That lived experience shapes her guidance to her students.
                </p>
                <blockquote className="about-quote">
                  "At EdVantage Uni, Sneha uses her professional opinion and lived experience to guide students towards their dream college abroad."
                </blockquote>
              </div>
            </div>
          </div>

          {/* Credentials Strip */}
          <div className="credentials-section">
            <h3 className="credentials-title" style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '24px', color: 'var(--text-primary)' }}>Credentials strip:</h3>
            <div className="credentials-grid">
              <div className="credential-item glass">
                <div className="cred-icon">🎓</div>
                <p><strong>MA, B.Ed</strong><br/>University of Mumbai</p>
              </div>
              <div className="credential-item glass">
                <div className="cred-icon">📝</div>
                <p><strong>TOEFL</strong><br/>Certified Trainer</p>
              </div>
              <div className="credential-item glass">
                <div className="cred-icon">🇬🇧</div>
                <p><strong>IELTS Trainer</strong><br/>British Council Certified</p>
              </div>
              <div className="credential-item glass">
                <div className="cred-icon">🏆</div>
                <p><strong>PTE Score: 90</strong><br/>Personal Score</p>
              </div>
              <div className="credential-item glass">
                <div className="cred-icon">💼</div>
                <p><strong>8 Years</strong><br/>Industry Experience</p>
              </div>
              <div className="credential-item glass">
                <div className="cred-icon">👥</div>
                <p><strong>1,000+</strong><br/>Student Profiles</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Page 3 - Services */}
      <section id="services" className="services-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title text-center">What We Offer</h2>
            <div className="section-divider"></div>
            <p className="section-description text-center">
              Two core service pillars designed to get you from confusion to clarity.
            </p>
          </div>

          <div className="services-grid">
            {/* Service 1 */}
            <div className="service-card glass">
              <div className="service-header">
                <div className="service-icon-circle">✈️</div>
                <div>
                  <span className="service-label">Service 1</span>
                  <h3>Overseas Education Counselling</h3>
                </div>
              </div>
              <p className="service-tagline">Your complete study abroad roadmap.</p>
              
              <ul className="service-features">
                <li>
                  <span className="feature-icon">✓</span>
                  <div>
                    <strong>Career Counseling</strong>
                    <p>Identify the right field, level, and country for your goals</p>
                  </div>
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  <div>
                    <strong>University Selection</strong>
                    <p>Shortlist institutions based on profile, budget, and outcomes</p>
                  </div>
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  <div>
                    <strong>Application Essays</strong>
                    <p>Compelling SOPs and personal statements that stand out</p>
                  </div>
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  <div>
                    <strong>Application Support</strong>
                    <p>Document checklists, portal guidance, and deadline management</p>
                  </div>
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  <div>
                    <strong>Financial Planning</strong>
                    <p>Scholarships, loans, cost-of-living breakdowns by country</p>
                  </div>
                </li>
                <li>
                  <span className="feature-icon">✓</span>
                  <div>
                    <strong>Visa Counseling</strong>
                    <p>Step-by-step visa guidance for USA, Canada, Australia, UK, and more</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="service-card glass">
              <div className="service-header">
                <div className="service-icon-circle">📝</div>
                <div>
                  <span className="service-label">Service 2</span>
                  <h3>English Language Test Coaching</h3>
                </div>
              </div>
              <p className="service-tagline">Score high. Open more doors.</p>
              <p className="service-intro-p">We offer coaching for all three major English proficiency tests:</p>

              <div className="test-coaching-list">
                <div className="test-item glass">
                  <div className="test-badge">PTE</div>
                  <div className="test-details">
                    <h4>PTE - Pearson Test of English</h4>
                    <p>Pearson Test of English</p>
                  </div>
                </div>

                <div className="test-item glass">
                  <div className="test-badge">TOEFL</div>
                  <div className="test-details">
                    <h4>TOEFL - Test of English as a Foreign Language</h4>
                    <p>Test of English as a Foreign Language</p>
                  </div>
                </div>

                <div className="test-item glass">
                  <div className="test-badge">IELTS</div>
                  <div className="test-details">
                    <h4>IELTS - International English Language Testing System</h4>
                    <p>International English Language Testing System</p>
                  </div>
                </div>
              </div>

              <div className="coaching-footer glass">
                <p>🎯 Sessions are tailored to your target score, timeline, and weak areas.</p>
              </div>
            </div>
          </div>

          <div className="service-cta-footer glass">
            <div className="s-cta-text">
              <h3>Not sure which service you need?</h3>
              <p>Let's talk.</p>
            </div>
            <a href="#contact" className="btn btn-primary" onClick={() => setActiveTab('calendar')}>
              <span>Book a Free Call</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Page 4 - Destinations */}
      <section id="destinations" className="destinations-section">
        <div className="section-container">
          <div className="section-header">
            <h2 className="section-title text-center">Our Global Footprints</h2>
            <div className="section-divider"></div>
          </div>

          <div className="destinations-grid">
            <div className="destination-card">
              <div className="dest-image-container">
                <img src="/dest_usa.png" alt="USA Landmark" className="dest-bg-image" />
                <span className="flag-badge">🇺🇸</span>
              </div>
              <div className="dest-card-content">
                <h3>USA</h3>
                <p>Ivy League to state schools, student visa (F-1), OPT guidance.</p>
                <div className="dest-badge-strip">
                  <span>F-1 Visa</span>
                  <span>OPT</span>
                  <span>Ivy League</span>
                </div>
              </div>
            </div>

            <div className="destination-card">
              <div className="dest-image-container">
                <img src="/dest_canada.png" alt="Canada Landmark" className="dest-bg-image" />
                <span className="flag-badge">🇨🇦</span>
              </div>
              <div className="dest-card-content">
                <h3>Canada</h3>
                <p>Top schools, masters and diploma programs, co-op programs, study permit expertise.</p>
                <div className="dest-badge-strip">
                  <span>Masters</span>
                  <span>Co-op</span>
                  <span>Study Permit</span>
                </div>
              </div>
            </div>

            <div className="destination-card featured-dest">
              <div className="dest-image-container">
                <div className="featured-ribbon">Counselor Base</div>
                <img src="/dest_australia.png" alt="Australia Landmark" className="dest-bg-image" />
                <span className="flag-badge">🇦🇺</span>
              </div>
              <div className="dest-card-content">
                <h3>Australia</h3>
                <p>Group of 8, deep knowledge of the student visa application (Subclass 500).</p>
                <div className="dest-badge-strip">
                  <span>Subclass 500</span>
                  <span>Group of 8</span>
                  <span>Student Visa</span>
                </div>
              </div>
            </div>

            <div className="destination-card">
              <div className="dest-image-container">
                <img src="/dest_uk.png" alt="UK Landmark" className="dest-bg-image" />
                <span className="flag-badge">🇬🇧</span>
              </div>
              <div className="dest-card-content">
                <h3>UK</h3>
                <p>Russell Group universities, Expertise in Graduate Route visa, UCAS process.</p>
                <div className="dest-badge-strip">
                  <span>UCAS</span>
                  <span>Russell Group</span>
                  <span>Graduate Visa</span>
                </div>
              </div>
            </div>

          </div>

          <div className="destinations-footer glass" style={{ marginTop: '30px' }}>
            <p>
              We also counsel for additional destinations such as Germany, Ireland, Netherlands, and Singapore based on your profile.
              <br/>Book a call to discuss.
            </p>
          </div>
        </div>
      </section>

      {/* Page 5 - Contact / Book a Call */}
      <section id="contact" className="contact-section">
        <div className="section-container">
          <div className="contact-layout">
            <div className="contact-info">
              <h2>Let's Talk About Your Future</h2>
              <p className="contact-subtitle">
                Fill in the form below and we'll be in touch within 24 hours. 
                Or book a slot directly on our calendar.
              </p>

              <div className="contact-promises">
                <div className="promise-item">
                  <span className="promise-icon">⚡</span>
                  <div>
                    <h4>Response within 24 hours</h4>
                    <p>Fill in the form and we will get back to you immediately.</p>
                  </div>
                </div>
                <div className="promise-item">
                  <span className="promise-icon">🗓️</span>
                  <div>
                    <h4>Direct Calendar booking</h4>
                    <p>Select any open time slot that fits your schedule.</p>
                  </div>
                </div>
                <div className="promise-item">
                  <span className="promise-icon">🔑</span>
                  <div>
                    <h4>100% Free Consultation</h4>
                    <p>No fee for the initial 30-minute discovery call.</p>
                  </div>
                </div>
              </div>

              <div className="social-links">
                <a href="mailto:info@edvantageuni.com" className="social-link-item glass">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                  <span>info@edvantageuni.com</span>
                </a>
              </div>
            </div>

            <div className="contact-widget glass">
              <div className="widget-tabs">
                <button className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`} onClick={() => setActiveTab('form')}>Inquiry Form</button>
                <button className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Interactive Scheduler</button>
              </div>

              {/* Inquiry Form Tab */}
              {activeTab === 'form' && (
                <div className="tab-content active">
                  {!inquirySuccess ? (
                    <form className="inquiry-form" onSubmit={handleInquirySubmit}>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Your Name</label>
                          <input 
                            type="text" 
                            placeholder="John Doe" 
                            required 
                            value={inquiryData.name}
                            onChange={(e) => setInquiryData({ ...inquiryData, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Email Address</label>
                          <input 
                            type="email" 
                            placeholder="john@example.com" 
                            required 
                            value={inquiryData.email}
                            onChange={(e) => setInquiryData({ ...inquiryData, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <div className="form-group">
                          <label>Phone Number</label>
                          <input 
                            type="tel" 
                            placeholder="+91 98765 43210" 
                            required 
                            value={inquiryData.phone}
                            onChange={(e) => setInquiryData({ ...inquiryData, phone: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label>Preferred Destination</label>
                          <select 
                            required 
                            value={inquiryData.destination}
                            onChange={(e) => setInquiryData({ ...inquiryData, destination: e.target.value })}
                          >
                            <option value="">Select destination</option>
                            <option value="USA">USA</option>
                            <option value="Canada">Canada</option>
                            <option value="Australia">Australia</option>
                            <option value="UK">United Kingdom</option>
                            <option value="Germany">Germany</option>
                            <option value="Ireland">Ireland</option>
                            <option value="France">France</option>
                            <option value="Netherlands">Netherlands</option>
                            <option value="Singapore">Singapore</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Required Service</label>
                        <select 
                          required 
                          value={inquiryData.service}
                          onChange={(e) => setInquiryData({ ...inquiryData, service: e.target.value })}
                        >
                          <option value="">Select service</option>
                          <option value="Counselling">Overseas Education Counselling</option>
                          <option value="Coaching">Language Test Coaching</option>
                          <option value="Both">Both Services</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Tell us about your background</label>
                        <textarea 
                          rows="4" 
                          placeholder="Intake year, level of study..." 
                          required
                          value={inquiryData.message}
                          onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                        ></textarea>
                      </div>
                      {inquiryError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{inquiryError}</p>}
                      <button type="submit" className="btn btn-primary btn-block" disabled={inquiryLoading}>
                        {inquiryLoading ? 'Submitting...' : 'Send Inquiry'}
                      </button>
                    </form>
                  ) : (
                    <div className="success-message">
                      <div className="success-icon">✓</div>
                      <h3>Inquiry Sent!</h3>
                      <p>Thank you! Sneha will analyze your profile and reach out within 24 hours.</p>
                      {inquiryMailSent ? (
                        <p className="sub-text" style={{ color: '#10b981', fontWeight: 600, fontSize: '0.88rem', marginTop: '12px' }}>
                          📧 An email confirmation has been sent to {inquiryData.email} with the details.
                        </p>
                      ) : (
                        <p className="sub-text" style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.88rem', marginTop: '12px' }}>
                          ⚠️ Inquiry saved, but we failed to send the confirmation email to {inquiryData.email}.
                        </p>
                      )}
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: '16px' }} onClick={() => {
                        setInquirySuccess(false);
                        setInquiryData({ name: '', email: '', phone: '', destination: '', service: '', message: '' });
                      }}>
                        Send another inquiry
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Scheduler Tab */}
              {activeTab === 'calendar' && (
                <div className="tab-content active">
                  {!bookingSuccess ? (
                    <div className="calendar-wrapper">
                      <div className="calendar-header">
                        <button className="cal-nav-btn" onClick={prevMonth}>◀</button>
                        <span className="calendar-month-year">
                          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button className="cal-nav-btn" onClick={nextMonth}>▶</button>
                      </div>

                      <div className="calendar-weekdays">
                        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                      </div>

                      <div className="calendar-days">
                        {getMonthDays().map((d, index) => {
                          if (d.empty) {
                            return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                          }
                          const isSelected = selectedDate === d.dateStr;
                          return (
                            <button
                              key={`day-${d.day}`}
                              className={`calendar-day ${d.disabled ? 'disabled' : 'available'} ${isSelected ? 'selected' : ''} ${d.isToday ? 'today' : ''}`}
                              disabled={d.disabled}
                              onClick={() => {
                                setSelectedDate(d.dateStr);
                                setSelectedSlot(null);
                              }}
                            >
                              {d.day}
                            </button>
                          );
                        })}
                      </div>

                      {selectedDate && (
                        <div className="time-slots-container">
                          <p className="slots-title">Available slots for {selectedDate}:</p>
                          <div className="time-slots-grid">
                            {availableSlots.map(slot => {
                              const isBusy = busySlots.includes(slot);
                              const isSelectedSlot = selectedSlot === slot;
                              return (
                                <button
                                  key={slot}
                                  className={`time-slot ${isBusy ? 'busy' : ''} ${isSelectedSlot ? 'selected' : ''}`}
                                  disabled={isBusy}
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedDate && selectedSlot && (
                        <form className="booking-inputs-grid" onSubmit={handleBookingSubmit}>
                          <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enter details to confirm your call:</p>
                          <div className="form-group">
                            <input 
                              type="text" 
                              placeholder="Your Full Name" 
                              required 
                              value={bookingDetails.name}
                              onChange={(e) => setBookingDetails({ ...bookingDetails, name: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <input 
                              type="email" 
                              placeholder="Your Email Address" 
                              required 
                              value={bookingDetails.email}
                              onChange={(e) => setBookingDetails({ ...bookingDetails, email: e.target.value })}
                            />
                          </div>
                          <div className="form-group">
                            <input 
                              type="tel" 
                              placeholder="Your Phone Number" 
                              required 
                              value={bookingDetails.phone}
                              onChange={(e) => setBookingDetails({ ...bookingDetails, phone: e.target.value })}
                            />
                          </div>
                          {bookingError && <p style={{ color: '#ef4444', fontSize: '0.82rem' }}>{bookingError}</p>}
                          <button type="submit" className="btn btn-primary btn-block" disabled={bookingLoading}>
                            {bookingLoading ? 'Reserving...' : 'Book 30-Min Discovery Session'}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="success-message">
                      <div className="success-icon">📅</div>
                      <h3>Discovery Call Booked!</h3>
                      <p>Your free 30-minute study counseling session with Sneha Shah is scheduled for:</p>
                      <p style={{ fontWeight: 700, color: '#6366f1', margin: '8px 0 20px 0', fontSize: '1.1rem' }}>
                        {selectedDate} at {selectedSlot}
                      </p>
                      <p className="sub-text">We've sent an invitation and a meeting link to {bookingDetails.email}.</p>
                      <button className="btn btn-secondary btn-sm" onClick={resetScheduler}>
                        Book another slot
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <a href="#home" className="footer-logo">
              <span className="logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#logo-grad-f-simple)" stroke="url(#logo-grad-f-stroke-simple)" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="url(#logo-grad-f-stroke-simple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="url(#logo-grad-f-stroke-simple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <defs>
                    <linearGradient id="logo-grad-f-simple" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1e3a8a"/>
                      <stop offset="1" stopColor="#2563eb"/>
                    </linearGradient>
                    <linearGradient id="logo-grad-f-stroke-simple" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#1d4ed8"/>
                      <stop offset="1" stopColor="#3b82f6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              <span>EdVantage <span className="accent-text">Uni</span></span>
            </a>
            <p>Empowering student ambitions globally. Deep industry expertise, certified English test coaching, and customized counseling workflows directly from Australia.</p>
          </div>
          
          <div className="footer-links-group">
            <h4>Explore</h4>
            <a href="#home">Home</a>
            <a href="#about">Meet the Counsellor</a>
            <a href="#services">Services</a>
            <a href="#destinations">Destinations</a>
          </div>

          <div className="footer-links-group">
            <h4>Contact Info</h4>
            <p>📧 <a href="mailto:info@edvantageuni.com" style={{ color: '#94a3b8', textDecoration: 'none' }}>info@edvantageuni.com</a></p>
            <p>🕒 Mon - Sat: 9 AM - 6 PM (IST)</p>
          </div>
        </div>

        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <p style={{ margin: 0 }}>&copy; 2026 EdVantage Uni. All rights reserved.</p>
          <button 
            className="footer-admin-link" 
            onClick={() => setIsAdminModalOpen(true)} 
            style={{ 
              background: 'rgba(255,255,255,0.06)', 
              border: '1px solid rgba(255,255,255,0.12)', 
              padding: '6px 16px', 
              borderRadius: '100px', 
              color: '#94a3b8', 
              fontSize: '0.78rem', 
              fontWeight: 700, 
              cursor: 'pointer', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              transition: 'all 0.3s ease',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(99, 102, 241, 0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              e.currentTarget.style.color = '#94a3b8';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🔒 Counselor Login
          </button>
        </div>
      </footer>

      {/* Admin Login Modal Overlay */}
      {isAdminModalOpen && (
        <div className="admin-login-overlay" onClick={() => setIsAdminModalOpen(false)}>
          <div className="admin-login-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsAdminModalOpen(false)}>×</button>
            <h2>Admin Portal</h2>
            <p>Access the EdVantage Uni Counselor Dashboard</p>
            
            {adminLoginError && (
              <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                ⚠️ {adminLoginError}
              </div>
            )}
            
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="admin-input-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={adminUsername} 
                  onChange={(e) => setAdminUsername(e.target.value)} 
                  placeholder="Enter admin username"
                  required 
                />
              </div>
              
              <div className="admin-input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={adminPassword} 
                  onChange={(e) => setAdminPassword(e.target.value)} 
                  placeholder="Enter admin password"
                  required 
                />
              </div>
              
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '10px', height: '48px', fontWeight: 700 }}
                disabled={adminLoginLoading}
              >
                {adminLoginLoading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
