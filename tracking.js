// Enhanced tracking.js
const firebaseConfig = {
  apiKey: "AIzaSyCjx0UgwFsQHFhDChLYjb8HYs0YYHFiwn4",
  authDomain: "accords-gamming.firebaseapp.com",
  projectId: "accords-gamming",
  storageBucket: "accords-gamming.firebasestorage.app",
  messagingSenderId: "578865144674",
  appId: "1:578865144674:web:040af4f1ea8dccda53023b",
  measurementId: "G-ZKZ6FWHFJE"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Detect device type
function getDeviceType() {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return "Tablet";
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return "Mobile";
  }
  return "Desktop";
}

// Get query parameters
function getQueryParams() {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    imageUrl: urlParams.get('url'),
    name: urlParams.get('name') || 'Unknown',
    phone: urlParams.get('phone') || 'Unknown',
    voucherDescription: urlParams.get('desc') || 'Voucher',
    billId: urlParams.get('billId') || 'N/A'
  };
}

// Track voucher view
// Modify the trackVoucherView function to prevent duplicates:
async function trackVoucherView() {
    const { imageUrl, name, phone, voucherDescription, billId } = getQueryParams();
    
    if (!imageUrl || !billId) {
        window.location.href = imageUrl || "index.html";
        return;
    }

    try {
        const deviceType = getDeviceType();
        let trackingId = null;
        
        // First check if a record exists for this billId
        const querySnapshot = await db.collection("imageClickTracking")
            .where("billId", "==", billId)
            .limit(1)
            .get();

        if (!querySnapshot.empty) {
            // Update existing record
            trackingId = querySnapshot.docs[0].id;
            await db.collection("imageClickTracking").doc(trackingId).update({
                lastView: firebase.firestore.FieldValue.serverTimestamp(),
                viewCount: firebase.firestore.FieldValue.increment(1),
                deviceType: deviceType,
                name: name || "Unknown",
                phone: phone || "N/A",
                voucherDescription: voucherDescription || "Voucher"
            });
        } else {
            // Create new record
            const docRef = await db.collection("imageClickTracking").add({
                imageUrl: imageUrl,
                name: name || "Unknown",
                phone: phone || "N/A",
                voucherDescription: voucherDescription || "Voucher",
                billId: billId,
                firstView: firebase.firestore.FieldValue.serverTimestamp(),
                lastView: firebase.firestore.FieldValue.serverTimestamp(),
                viewCount: 1,
                deviceType: deviceType,
                scratched: true,
                scratchedAt: null
            });
            trackingId = docRef.id;
        }

        // Store tracking ID in session storage
        sessionStorage.setItem('voucherTrackingId', trackingId);
        
        // Redirect to scratch interface
        window.location.href = `voucher-scratch.html?trackingId=${trackingId}&imageUrl=${encodeURIComponent(imageUrl)}`;
        
    } catch (err) {
        console.error("Tracking error:", err);
        window.location.href = imageUrl;
    }
}

// Initialize tracking
document.addEventListener("DOMContentLoaded", trackVoucherView);
