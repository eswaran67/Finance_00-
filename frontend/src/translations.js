// Comprehensive Tamil & English translations dictionary

export const translations = {
  en: {
    // Nav & Brand
    brandSubtitle: "WEEKLY FINANCE DASHBOARD",
    brandTitle: "Weekly Finance",
    routeSheetBtn: "Route Sheet",
    refreshBtn: "Refresh",
    signOutBtn: "Sign Out",
    lightMode: "Light",
    darkMode: "Dark",
    langName: "தமிழ்",

    // Notifications & Due Alerts
    duesTitle: "Today's Dues",
    duesCount: "Due",
    clearAll: "Clear All",
    checkAgain: "Check Again",
    dueAlertHeading: "Today's Payment Due Alert: {count} Borrowers Need to Pay Today!",
    dueAlertSub: "Total pending due to collect today: {amount}",
    viewList: "View List",
    allCaughtUp: "All Caught Up!",
    allCaughtUpSub: "No pending borrower dues left for today. All scheduled collections are up to date!",
    whatsappReminder: "WhatsApp Reminder",
    balance: "Bal",
    dismiss: "Dismiss",

    // Hero & Action Buttons
    heroTitle: "Weekly Finance Management",
    heroSub: "Loans, today's collections, monthly reports & customer passbook",
    newCustomerBtn: "New Customer",
    disburseLoanBtn: "Disburse Loan",
    recordPaymentBtn: "Record Payment",

    // Metric Cards
    todayCollectionTitle: "Today's Collection",
    todayBadge: "⚡ LIVE TODAY",
    todayCollectedSub: "⚡ {count} payments collected today ({date})",
    weekCollectionTitle: "This Week Collection",
    weekTarget: "Target: {amount} / week",
    monthCollectionTitle: "This Month Collection",
    monthCollectionsCount: "📅 {month} ({count} collections)",
    yearCollectionTitle: "Year {year} Collection",
    yearTotalSub: "🏆 Total collection in {year}",
    pendingBalanceTitle: "Pending Balance",
    pendingLoansSub: "⚠️ Dues across {count} active loans",
    allTimeCollectedTitle: "All-Time Collected",
    allTimeCustomersSub: "👥 {count} Customers Registered",

    // Search by Date Bar
    searchByDateTitle: "Search by Specific Date:",
    dateQuickToday: "⚡ Today",
    dateQuickYesterday: "📅 Yesterday",
    dateQuickClear: "Clear",
    dateResultHeading: "Collections on Date: {date}",
    dateResultTodayBadge: "(Today)",
    receiptsFound: "{count} Payment Receipts Found",
    showAllRecords: "Show All Records",

    // Search & Filter
    searchPlaceholder: "Search by Customer Name, Phone, or Area...",
    routeAreaLabel: "Route / Area:",
    allRoutes: "All Routes",
    statusLabel: "Status:",
    allStatus: "All Status",
    activeOnly: "Active Only",
    completedOnly: "Completed",

    // Tabs
    tabCustomers: "Customers Directory",
    tabLoans: "Loan Accounts",
    tabCollections: "Collections Ledger",
    tabAnalytics: "Period Analytics",

    // Table Headers
    colCustomer: "Customer",
    colPhoneArea: "Phone & Area",
    colStartDate: "Loan Start Date",
    colTotalBorrowed: "Total Borrowed",
    colPaidAmount: "Paid Amount",
    colPendingBalance: "Pending Balance",
    colFinanceStatus: "Finance Status",
    colActions: "Actions",
    colLoanId: "Loan ID",
    colPrincipalTotal: "Principal & Total",
    colWeeklyInstallment: "Weekly Installment",
    colPaidVsBalance: "Paid / Balance",
    colRepaymentProgress: "Repayment Progress",
    colReceiptNo: "Receipt No",
    colAmount: "Amount",
    colCollectionDate: "Collection Date",
    colCollectorNotes: "Notes",

    // Badges & Row Actions
    badgeActive: "Active",
    badgeCompleted: "✓ Completed",
    badgeNoLoans: "No Loans",
    btnCollect: "Collect",
    btnPassbook: "Passbook",
    btnDelete: "Delete",
    btnMarkSettled: "Mark as Settled / Close",
    btnReverse: "Reverse / Delete",
    noCustomersFound: "No customers found matching the search criteria.",
    noLoansFound: "No loan records found.",
    noCollectionsFound: "No collection receipts found for this period.",
    weekProgress: "Week {week} of {total}",

    // Period Analytics
    periodAll: "All Time",
    periodToday: "Today",
    periodThisWeek: "This Week",
    periodThisMonth: "This Month",
    periodThisYear: "This Year",
    periodSummaryTitle: "Total Collection ({period}):",
    analyticsTotalBorrowed: "Total Disbursed (Principal)",
    analyticsTotalInterest: "Expected Interest Revenue",
    analyticsTotalRepayable: "Total Portfolio Value",
    analyticsTotalPaid: "Total Recovered So Far",
    analyticsOutstanding: "Total Outstanding Balance",
    analyticsCollectionRate: "Recovery Rate",

    // Modals
    // Modal: New Customer
    modalNewCustomerTitle: "Add New Customer",
    labelFullName: "Full Name *",
    placeholderFullName: "e.g. Ramesh Kumar",
    labelPhone: "Phone Number *",
    placeholderPhone: "10-digit mobile number",
    labelArea: "Area / Route *",
    placeholderArea: "e.g. Market Street, Bus Stand",
    labelAddress: "Address (Optional)",
    placeholderAddress: "Door no, street details...",
    btnSaveCustomer: "Save Customer",
    btnCancel: "Cancel",

    // Modal: Disburse Loan
    modalDisburseTitle: "Disburse New Loan",
    labelSelectCustomer: "Select Customer *",
    selectCustomerPrompt: "-- Choose a customer --",
    labelPrincipal: "Principal Amount (₹) *",
    labelInterestRate: "Interest Rate (%)",
    labelTenureWeeks: "Tenure (Weeks) *",
    labelLoanStartDate: "Loan Start Date *",
    summaryTotalInterest: "Total Interest:",
    summaryTotalPayable: "Total Repayable:",
    summaryWeeklyDue: "Weekly Installment:",
    btnDisburseConfirm: "Disburse Loan",

    // Modal: Record Payment
    modalPaymentTitle: "Record Collection Payment",
    labelSelectLoan: "Select Active Loan *",
    selectLoanPrompt: "-- Select customer & active loan --",
    labelPaymentAmount: "Collection Amount (₹) *",
    labelPaymentDate: "Collection Date *",
    labelPaymentNotes: "Payment Notes / Remarks",
    placeholderPaymentNotes: "e.g. Cash collected at shop, GPay, etc.",
    summaryCurrentBalance: "Current Balance Due:",
    summaryNewBalance: "Projected Remaining Balance:",
    btnRecordConfirm: "Record Payment",

    // Modal: Route Sheet
    modalRouteSheetTitle: "Today's Collection Route Sheet",
    routeSheetSubtitle: "Printed for field collection staff on {date}",
    printBtn: "Print Route Sheet",
    totalExpectedCollection: "Total Expected Today:",
    borrowerCount: "Borrowers on Route:",

    // Modal: Passbook
    modalPassbookTitle: "Customer Passbook & Ledger Statement",
    passbookAccountSummary: "Account Summary",
    passbookHistory: "Collection Payment History",
    passbookNoPayments: "No collection payments recorded yet for this customer.",

    // Modal: Delete Confirm
    modalDeleteTitle: "Confirm Deletion",
    modalDeleteMsg: "Are you sure you want to delete {name}? This action cannot be undone.",
    btnConfirmDelete: "Yes, Delete",

    // Auth Screen
    authSubtitle: "WEEKLY FINANCE DASHBOARD",
    authTitle: "Weekly Finance",
    authDesc: "Sign in to securely manage your customers, loans, and collections.",
    authEmail: "Email",
    authPassword: "Password",
    btnCreateAccount: "Create account",
    btnSignIn: "Sign in",
    toggleToSignIn: "Already registered? Sign in",
    toggleToCreate: "New here? Create account",
    backendApiStatus: "Backend API:",
    onlineText: "Online (Port 5000)",
    offlineText: "Offline",
    checkConnection: "Check Connection",

    // Background Customizer
    bgCustomizerBtn: "Background",
    bgModalTitle: "Website Background & Theme Customizer",
    bgModalSub: "Customize website background colors, luxury dark/light themes, or upload your own image wallpaper",
    bgTabPresets: "🎨 Themes & Presets",
    bgTabColor: "🌈 Custom Color",
    bgTabImage: "🖼️ Custom Wallpaper Image",
    bgSelectPreset: "Choose an Executive Theme:",
    bgCustomColorLabel: "Select Custom Background Color:",
    bgCustomImageLabel: "Upload or Enter Image URL:",
    bgUploadImage: "Upload Image from Device",
    bgImageUrlPlaceholder: "Paste image URL (https://...)",
    bgOverlayDarkness: "Darkness Overlay (Readability):",
    bgBlurLevel: "Glass Blur Level:",
    bgResetDefault: "Reset to Default Theme",
    bgApply: "Apply & Save Background",
    bgSavedToast: "Website background updated successfully!",

    // Save to My Files
    saveToFilesBtn: "Save to My Files",
    saveDateToFilesBtn: "Save Date to File",
    saveModalTitle: "Save to My Files & Data Export",
    saveModalSub: "Download full database backup, Excel spreadsheets, and date-wise reports directly to your device",
    exportJsonBackup: "Complete System Backup (JSON File)",
    exportJsonBackupSub: "Full database backup containing all customers, loans, collections & financial logs",
    exportCsvLedger: "Complete Accounts Ledger (Excel / CSV)",
    exportCsvLedgerSub: "Full spreadsheet of all receipts, customer loans & balances for Excel or Google Sheets",
    exportCustomersCsv: "Customers Directory (Excel / CSV)",
    exportCustomersCsvSub: "Complete list of customer names, mobile numbers, routes, and pending balances",
    exportDateWiseCsv: "Date-wise Collection Report (CSV)",
    exportDateWiseSub: "Receipts and collection totals for a specific date or date range",
    chooseDateForExport: "Choose Date to Export:",
    allDatesOption: "All Dates (Complete History)",
    downloadFileBtn: "Download File",
    fileSavedToast: "File downloaded successfully to your device!"
  },

  ta: {
    // Nav & Brand
    brandSubtitle: "வாராந்திர நிதி மேலாண்மை",
    brandTitle: "வீக்லி ஃபைனான்ஸ்",
    routeSheetBtn: "வசூல் பட்டியல்",
    refreshBtn: "புதுப்பி",
    signOutBtn: "வெளியேறு",
    lightMode: "பகல் பயன்முறை",
    darkMode: "இரவு பயன்முறை",
    langName: "English",

    // Notifications & Due Alerts
    duesTitle: "இன்றைய தவணைகள்",
    duesCount: "தவணை பாக்கி",
    clearAll: "அனைத்தும் நீக்கு",
    checkAgain: "மீண்டும் சரிபார்",
    dueAlertHeading: "🔔 இன்றைய தவணை அறிவிப்பு: {count} நபர்கள் இன்று பணம் செலுத்த வேண்டும்!",
    dueAlertSub: "இன்று வசூலிக்க வேண்டிய மொத்த தொகை: {amount}",
    viewList: "பட்டியல் பார்க்க",
    allCaughtUp: "அனைத்தும் பெறப்பட்டது!",
    allCaughtUpSub: "இன்றைய நிலுவைத் தவணைகள் ஏதுமில்லை. அனைத்து வசூல்களும் பெறப்பட்டுள்ளன!",
    whatsappReminder: "வாட்ஸ்அப் நினைவூட்டல்",
    balance: "பாக்கி",
    dismiss: "நீக்கு",

    // Hero & Action Buttons
    heroTitle: "வாராந்திர நிதி மேலாண்மை",
    heroSub: "கடன் விவரங்கள், இன்றைய வசூல், மாதாந்திர வசூல் & வாடிக்கையாளர் பாஸ்புக்",
    newCustomerBtn: "புதிய நபர்",
    disburseLoanBtn: "கடன் கொடுக்க",
    recordPaymentBtn: "வசூல் பதிவு",

    // Metric Cards
    todayCollectionTitle: "இன்றைய வசூல்",
    todayBadge: "⚡ நேரலை",
    todayCollectedSub: "⚡ இன்று {count} தவணைகள் வசூலிக்கப்பட்டன ({date})",
    weekCollectionTitle: "இந்த வார வசூல்",
    weekTarget: "இலக்கு: வாரம் {amount}",
    monthCollectionTitle: "இந்த மாத வசூல்",
    monthCollectionsCount: "📅 {month} ({count} வசூல்கள்)",
    yearCollectionTitle: "{year} ஆண்டு வசூல்",
    yearTotalSub: "🏆 {year} ஆண்டின் மொத்த வசூல்",
    pendingBalanceTitle: "மீதி பாக்கி",
    pendingLoansSub: "⚠️ {count} நிலுவைக் கடன்களின் மொத்த பாக்கி",
    allTimeCollectedTitle: "மொத்த வசூல்",
    allTimeCustomersSub: "👥 {count} வாடிக்கையாளர்கள் பதிவு",

    // Search by Date Bar
    searchByDateTitle: "தேதி வாரியாக வசூல் பார்க்க:",
    dateQuickToday: "⚡ இன்று",
    dateQuickYesterday: "📅 நேற்று",
    dateQuickClear: "அனைத்தும்",
    dateResultHeading: "தேதி வாரியான வசூல்: {date}",
    dateResultTodayBadge: "(இன்று)",
    receiptsFound: "{count} வசூல் ரசீதுகள்",
    showAllRecords: "அனைத்தையும் காட்டு",

    // Search & Filter
    searchPlaceholder: "வாடிக்கையாளர் பெயர், எண் அல்லது பகுதி மூலம் தேடுக...",
    routeAreaLabel: "வசூல் பகுதி:",
    allRoutes: "அனைத்து பகுதிகள்",
    statusLabel: "கடன் நிலை:",
    allStatus: "அனைத்து நிலைகள்",
    activeOnly: "வசூலில் உள்ளவை",
    completedOnly: "முடிந்தவை",

    // Tabs
    tabCustomers: "வாடிக்கையாளர் விபரம்",
    tabLoans: "கடன் கணக்குகள்",
    tabCollections: "வசூல் லெட்ஜர்",
    tabAnalytics: "காலமுறை அறிக்கை",

    // Table Headers
    colCustomer: "வாடிக்கையாளர்",
    colPhoneArea: "எண் & பகுதி",
    colStartDate: "கடன் வாங்கிய தேதி",
    colTotalBorrowed: "கடன் தொகை",
    colPaidAmount: "கொடுத்த தொகை",
    colPendingBalance: "மீதி பாக்கி",
    colFinanceStatus: "கடன் நிலை",
    colActions: "செயல்கள்",
    colLoanId: "கடன் எண்",
    colPrincipalTotal: "அசல் & வட்டி மொத்தம்",
    colWeeklyInstallment: "வார தவணை",
    colPaidVsBalance: "செலுத்தியது / பாக்கி",
    colRepaymentProgress: "தவணை முன்னேற்றம்",
    colReceiptNo: "ரசீது எண்",
    colAmount: "தொகை",
    colCollectionDate: "வசூல் தேதி",
    colCollectorNotes: "குறிப்பு",

    // Badges & Row Actions
    badgeActive: "வசூலில் உள்ளது",
    badgeCompleted: "✓ முடிந்தது",
    badgeNoLoans: "கடன்கள் இல்லை",
    btnCollect: "வசூல்",
    btnPassbook: "பாஸ்புக்",
    btnDelete: "நீக்கு",
    btnMarkSettled: "கணக்கை முடி (Close)",
    btnReverse: "ரசீதை நீக்கு",
    noCustomersFound: "தேடலுக்குரிய வாடிக்கையாளர் விவரங்கள் கிடைக்கவில்லை.",
    noLoansFound: "கடன் பதிவுகள் ஏதுமில்லை.",
    noCollectionsFound: "இக்காலத்திற்குரிய வசூல் ரசீதுகள் ஏதுமில்லை.",
    weekProgress: "வாரம் {week} / {total}",

    // Period Analytics
    periodAll: "மொத்த காலம்",
    periodToday: "இன்று",
    periodThisWeek: "இந்த வாரம்",
    periodThisMonth: "இந்த மாதம்",
    periodThisYear: "இந்த ஆண்டு",
    periodSummaryTitle: "மொத்த வசூல் ({period}):",
    analyticsTotalBorrowed: "மொத்த அசல் வழங்கியது",
    analyticsTotalInterest: "எதிர்பார்க்கப்படும் வட்டி",
    analyticsTotalRepayable: "மொத்த வசூலிக்க வேண்டியது",
    analyticsTotalPaid: "இதுவரை வசூலான தொகை",
    analyticsOutstanding: "இன்னும் வரவேண்டிய மீதி பாக்கி",
    analyticsCollectionRate: "வசூல் விகிதம் (Recovery)",

    // Modals
    // Modal: New Customer
    modalNewCustomerTitle: "புதிய வாடிக்கையாளர் சேர்க்க",
    labelFullName: "முழு பெயர் *",
    placeholderFullName: "எ.கா: ரமேஷ் குமார்",
    labelPhone: "தொலைபேசி எண் *",
    placeholderPhone: "10 இலக்க கைபேசி எண்",
    labelArea: "வசூல் பகுதி / ஊர் *",
    placeholderArea: "எ.கா: பஜார் வீதி, பேருந்து நிலையம்",
    labelAddress: "முகவரி (விருப்பத்தேர்வு)",
    placeholderAddress: "கதவு எண், தெரு விவரம்...",
    btnSaveCustomer: "வாடிக்கையாளரை சேமி",
    btnCancel: "ரத்து செய்",

    // Modal: Disburse Loan
    modalDisburseTitle: "புதிய கடன் கொடுக்க",
    labelSelectCustomer: "வாடிக்கையாளரை தேர்வு செய் *",
    selectCustomerPrompt: "-- வாடிக்கையாளரை தேர்ந்தெடுக்கவும் --",
    labelPrincipal: "அசல் கடன் தொகை (₹) *",
    labelInterestRate: "வட்டி விகிதம் (%)",
    labelTenureWeeks: "தவணை காலம் (வாரங்கள்) *",
    labelLoanStartDate: "கடன் துவங்கும் தேதி *",
    summaryTotalInterest: "மொத்த வட்டி:",
    summaryTotalPayable: "திருப்பி செலுத்த வேண்டிய மொத்தம்:",
    summaryWeeklyDue: "வார தவணை தொகை:",
    btnDisburseConfirm: "கடன் வழங்கு",

    // Modal: Record Payment
    modalPaymentTitle: "வசூல் தவணை பதிவு",
    labelSelectLoan: "செயலில் உள்ள கடனை தேர்வு செய் *",
    selectLoanPrompt: "-- நபர் மற்றும் கடனை தேர்வு செய்க --",
    labelPaymentAmount: "வசூல் செய்த தொகை (₹) *",
    labelPaymentDate: "வசூல் தேதி *",
    labelPaymentNotes: "குறிப்பு விவரம்",
    placeholderPaymentNotes: "எ.கா: கடையில் வசூல், ஜிபே (GPay) போன்றவை...",
    summaryCurrentBalance: "தற்போதைய பாக்கி:",
    summaryNewBalance: "இச்செலுத்தலுக்குப் பின் மீதி பாக்கி:",
    btnRecordConfirm: "வசூலை பதிவு செய்",

    // Modal: Route Sheet
    modalRouteSheetTitle: "இன்றைய தினசரி வசூல் பட்டியல்",
    routeSheetSubtitle: "வசூலாளருக்காக அச்சிடப்பட்ட பட்டியல் - {date}",
    printBtn: "பட்டியலை அச்சிடு (Print)",
    totalExpectedCollection: "இன்று எதிர்பார்க்கப்படும் வசூல்:",
    borrowerCount: "இன்றைய வாடிக்கையாளர்கள்:",

    // Modal: Passbook
    modalPassbookTitle: "வாடிக்கையாளர் பாஸ்புக் & கணக்கு அறிக்கை",
    passbookAccountSummary: "கடன் சுருக்கம்",
    passbookHistory: "செலுத்தப்பட்ட தவணை விவரங்கள்",
    passbookNoPayments: "இதுவரை தவணைகள் எதுவும் செலுத்தப்படவில்லை.",

    // Modal: Delete Confirm
    modalDeleteTitle: "நீக்குதலை உறுதி செய்க",
    modalDeleteMsg: "{name} விவரங்களை நிச்சயமாக நீக்க விரும்புகிறீர்களா? இதை மீட்டெடுக்க முடியாது.",
    btnConfirmDelete: "ஆம், நீக்கு",

    // Auth Screen
    authSubtitle: "வாராந்திர நிதி மேலாண்மை",
    authTitle: "வீக்லி ஃபைனான்ஸ்",
    authDesc: "உங்கள் வாடிக்கையாளர்கள், கடன்கள் மற்றும் வசூல்களை பாதுகாப்பாக நிர்வகிக்க உள்நுழையவும்.",
    authEmail: "மின்னஞ்சல்",
    authPassword: "கடவுச்சொல்",
    btnCreateAccount: "கணக்கு தொடங்க",
    btnSignIn: "உள்நுழைக",
    toggleToSignIn: "ஏற்கனவே கணக்கு உள்ளதா? உள்நுழைக",
    toggleToCreate: "புதியவரா? கணக்கு தொடங்க",
    backendApiStatus: "சர்வர் நிலை:",
    onlineText: "இணைக்கப்பட்டுள்ளது (போர்ட் 5000)",
    offlineText: "இணைக்கப்படவில்லை",
    checkConnection: "இணைப்பை சரிபார்",

    // Background Customizer
    bgCustomizerBtn: "பின்னணி",
    bgModalTitle: "வலைத்தள பின்னணி & தீம் அமைப்புகள்",
    bgModalSub: "வலைத்தளத்தின் பின்னணி நிறம், பிரீமியம் தீம்கள், படங்கள் மற்றும் வால்பேப்பர்களை மாற்றவும்",
    bgTabPresets: "🎨 தீம்கள் & மாதிரிகள்",
    bgTabColor: "🌈 தனிப்பயன் வண்ணம்",
    bgTabImage: "🖼️ பின்னணி படம் / வால்பேப்பர்",
    bgSelectPreset: "பிரீமியம் தீமைத் தேர்ந்தெடுக்கவும்:",
    bgCustomColorLabel: "விரும்பிய பின்னணி வண்ணத்தை தேர்வு செய்க:",
    bgCustomImageLabel: "படம் பதிவேற்ற அல்லது URL இணைக்க:",
    bgUploadImage: "சாதனத்திலிருந்து படம் பதிவேற்றவும்",
    bgImageUrlPlaceholder: "படத்தின் URL உள்ளிடவும் (https://...)",
    bgOverlayDarkness: "இருள் / தெளிவு நிலை (Darkness Overlay):",
    bgBlurLevel: "மங்கலாக்கும் அளவு (Glass Blur):",
    bgResetDefault: "இயல்பு நிலைக்கு மீட்டமை",
    bgApply: "பின்னணியை அமை & சேமி",
    bgSavedToast: "வலைத்தள பின்னணி வெற்றிகரமாக மாற்றப்பட்டது!",

    // Save to My Files
    saveToFilesBtn: "கோப்பில் சேமி",
    saveDateToFilesBtn: "தேதியை கோப்பில் சேமி",
    saveModalTitle: "கோப்பில் சேமி & தரவு ஏற்றுமதி",
    saveModalSub: "முழு நிதி காப்புப்பிரதி, எக்செல் விரிதாள்கள் மற்றும் தேதி அறிக்கைகளை உங்கள் சாதனத்தில் பதிவிறக்கவும்",
    exportJsonBackup: "முழு சிஸ்டம் காப்புப்பிரதி (JSON கோப்பு)",
    exportJsonBackupSub: "வாடிக்கையாளர்கள், கடன்கள், வசூல் விவரங்களின் முழுமையான பேக்கப் கோப்பு",
    exportCsvLedger: "முழு வசூல் கணக்கு ஏடு (Excel / CSV கோப்பு)",
    exportCsvLedgerSub: "எக்செல் அல்லது கூகிள் ஷீட்ஸில் திறக்கக்கூடிய முழு கணக்கு விவரங்கள்",
    exportCustomersCsv: "வாடிக்கையாளர் பட்டியல் (Excel / CSV கோப்பு)",
    exportCustomersCsvSub: "பெயர்கள், போன் எண்கள், பகுதிகள் மற்றும் பாக்கி தொகைகளின் பட்டியல்",
    exportDateWiseCsv: "தேதி வாரியான வசூல் அறிக்கை (CSV)",
    exportDateWiseSub: "குறிப்பிட்ட தேதிக்கான அனைத்து வசூல்கள் மற்றும் மொத்த தொகை அறிக்கை",
    chooseDateForExport: "ஏற்றுமதி செய்ய வேண்டிய தேதியை தேர்வு செய்க:",
    allDatesOption: "அனைத்து தேதிகளும் (முழு வரலாறு)",
    downloadFileBtn: "கோப்பைப் பதிவிறக்கு",
    fileSavedToast: "கோப்பு உங்கள் சாதனத்தில் வெற்றிகரமாக சேமிக்கப்பட்டது!"
  }
};

/**
 * Translation helper function with variable interpolation:
 * e.g. t('dueAlertHeading', { count: 3 })
 */
export function getTranslation(lang, key, params = {}) {
  const dict = translations[lang] || translations.en;
  let text = dict[key] || translations.en[key] || key;
  
  if (params && typeof params === 'object') {
    Object.keys(params).forEach(pKey => {
      text = text.replace(new RegExp(`\\{${pKey}\\}`, 'g'), params[pKey]);
    });
  }
  return text;
}

