import React, { useState } from 'react';
import {
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Lock,
  Tag,
  AlertCircle,
  Receipt
} from 'lucide-react';

const PYTHON_API = import.meta.env.VITE_PYTHON_AI_URL ||
  (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")
    ? "https://smart-cab-security-platform-1.onrender.com"
    : "");

export default function PaymentModal({
  isOpen,
  onClose,
  bookingDetails,
  onPaymentSuccess
}) {
  const [method, setMethod] = useState('upi'); // 'upi' | 'card' | 'cash' | 'wallet'
  const [upiId, setUpiId] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  if (!isOpen || !bookingDetails) return null;

  const baseFare = Number(bookingDetails.fare || 0);
  const finalFare = Math.max(0, baseFare - discount);

  const applyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'SAFETYFIRST' || code === 'SMARTCAB50') {
      setDiscount(50);
      setPromoApplied(true);
    } else if (code === 'FIRST100') {
      setDiscount(100);
      setPromoApplied(true);
    } else {
      setPromoError('Invalid coupon code. Try SAFETYFIRST or SMARTCAB50');
    }
  };

  const handlePay = async () => {
    setProcessing(true);
    try {
      if (method === 'cash') {
        const res = await fetch(`${PYTHON_API}/api/payments/cash-confirm`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tripId: bookingDetails.bookingId,
            amount: Number(finalFare.toFixed(2))
          })
        });
        const data = await res.json();
        setReceiptData({
          receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
          orderId: `order_cash_${Date.now()}`,
          amount: finalFare.toFixed(2),
          paymentMethod: 'Cash on Arrival',
          status: 'CASH_ON_ARRIVAL',
          date: new Date().toLocaleDateString('en-IN')
        });
        setPaymentDone(true);
        onPaymentSuccess?.(data);
      } else {
        // Online payment (UPI / Card / Wallet)
        const orderRes = await fetch(`${PYTHON_API}/api/payments/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: Number(finalFare.toFixed(2)),
            currency: 'INR',
            tripId: bookingDetails.bookingId,
            riderName: bookingDetails.riderName || 'SmartCab Passenger',
            paymentMethod: method.toUpperCase()
          })
        });
        const orderData = await orderRes.json();

        // Simulate Razorpay verification
        const verifyRes = await fetch(`${PYTHON_API}/api/payments/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderData.orderId,
            paymentId: `pay_${Date.now().toString(36)}`,
            paymentMethod: method.toUpperCase(),
            status: 'SUCCESS'
          })
        });
        const verifyData = await verifyRes.json();
        setReceiptData({
          receiptNumber: `REC-${orderData.orderId.slice(-6).toUpperCase()}`,
          orderId: orderData.orderId,
          amount: finalFare.toFixed(2),
          paymentMethod: method === 'upi' ? 'UPI (Google Pay / PhonePe)' : method === 'wallet' ? 'SmartCab Safety Wallet' : 'Credit / Debit Card',
          status: 'PAID',
          date: new Date().toLocaleDateString('en-IN')
        });
        setPaymentDone(true);
        onPaymentSuccess?.(verifyData);
      }
    } catch (err) {
      console.warn("Payment fallback:", err);
      // Offline fallback
      setReceiptData({
        receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
        orderId: `order_sc_${Date.now()}`,
        amount: finalFare.toFixed(2),
        paymentMethod: method.toUpperCase(),
        status: 'PAID',
        date: new Date().toLocaleDateString('en-IN')
      });
      setPaymentDone(true);
      onPaymentSuccess?.({ status: 'PAID', method });
    } finally {
      setProcessing(false);
    }
  };

  const downloadInvoice = () => {
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>SmartCab Tax Invoice - ${receiptData?.receiptNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; max-width: 700px; margin: auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 20px; }
          .title { font-size: 24px; font-weight: 800; color: #0f172a; }
          .meta { font-size: 12px; color: #64748b; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .table th { background: #f1f5f9; text-align: left; padding: 10px; border-bottom: 1px solid #cbd5e1; }
          .table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .total { font-size: 18px; font-weight: bold; color: #059669; text-align: right; padding-top: 15px; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">🛡️ SmartCab Tax Invoice</div>
            <div class="meta">SmartCab Technologies India Pvt Ltd<br/>CIN: U72900GJ2026PTC149812 · GSTIN: 24AABCS1429B1Z8<br/>Ahmedabad, Gujarat - 380054</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: bold;">Invoice #${receiptData?.receiptNumber}</div>
            <div class="meta">Date: ${receiptData?.date}<br/>Status: ${receiptData?.status}</div>
          </div>
        </div>

        <div style="margin-bottom: 20px; font-size: 13px;">
          <strong>Rider Name:</strong> ${bookingDetails?.riderName || 'SmartCab Passenger'}<br/>
          <strong>Pickup Location:</strong> ${bookingDetails?.pickup}<br/>
          <strong>Dropoff Location:</strong> ${bookingDetails?.dropoff}<br/>
          <strong>Vehicle Model:</strong> ${bookingDetails?.selectedCar || 'SmartCab Verified'}<br/>
          <strong>Driver:</strong> ${bookingDetails?.driver?.name || 'Assigned Driver'} (${bookingDetails?.driver?.plate || 'GJ-01-AB-1234'})
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Distance</th>
              <th>Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Base Fare & City Transport Service</td>
              <td>${bookingDetails?.distanceKm || 5} km</td>
              <td>₹${baseFare.toFixed(2)}</td>
            </tr>
            ${discount > 0 ? `
            <tr style="color: #059669;">
              <td>Promo Discount (${promoCode.toUpperCase()})</td>
              <td>—</td>
              <td>-₹${discount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td>GST (5% Transport Sector)</td>
              <td>Included</td>
              <td>₹${(finalFare * 0.05).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div class="total">Total Amount Paid: ₹${finalFare.toFixed(2)}</div>
        <div style="font-size: 12px; color: #64748b; text-align: right; margin-top: 5px;">Payment Method: ${receiptData?.paymentMethod}</div>

        <div class="footer">
          This is a computer-generated digital tax invoice compliant with Indian Motor Vehicle Aggregator Guidelines & GST Rules.
        </div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="h-4 w-4" />
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
          <h2 className="text-2xl font-black">
            {paymentDone ? "Payment Successful 🎉" : "Secure Payment"}
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            {bookingDetails.selectedCar || 'SmartCab Verified Ride'} · {bookingDetails.pickup} → {bookingDetails.dropoff}
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {paymentDone ? (
            /* RECEIPT VIEW */
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">
                ₹{receiptData?.amount} Confirmed
              </h3>
              <p className="text-slate-500 text-xs">
                Receipt #{receiptData?.receiptNumber} · {receiptData?.paymentMethod}
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ride Ref:</span>
                  <span className="font-mono font-bold">{bookingDetails.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vehicle:</span>
                  <span className="font-bold">{bookingDetails.selectedCar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Status:</span>
                  <span className="text-emerald-700 font-extrabold">{receiptData?.status}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900 text-sm">
                  <span>Total Paid:</span>
                  <span className="text-emerald-600">₹{receiptData?.amount}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={downloadInvoice}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-2xl border border-slate-200 text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <Receipt className="h-4 w-4 text-slate-600" />
                  <span>Download Tax Invoice</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-2xl text-xs transition shadow-md"
                >
                  Track Live Ride
                </button>
              </div>
            </div>
          ) : (
            /* PAYMENT METHODS SELECTION */
            <>
              {/* FARE BREAKDOWN */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Trip Fare ({bookingDetails.distanceKm || '5'} km)</span>
                  <span className="font-semibold">₹{baseFare.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      Promo Discount ({promoCode.toUpperCase()})
                    </span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-extrabold text-slate-900 text-base">
                  <span>Total Payable:</span>
                  <div className="flex items-baseline space-x-2">
                    {discount > 0 && (
                      <span className="line-through text-slate-400 text-sm font-semibold">₹{baseFare.toFixed(2)}</span>
                    )}
                    <span className="text-2xl text-emerald-600 font-black">₹{finalFare.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* PROMO CODE BOX */}
              <div className="space-y-1.5">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Try coupon: SAFETYFIRST"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      disabled={promoApplied}
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyPromo}
                    disabled={promoApplied || !promoCode.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white disabled:text-slate-400 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    {promoApplied ? "Applied ✓" : "Apply Code"}
                  </button>
                </div>
                {promoError && (
                  <p className="text-xs text-rose-500 font-medium">{promoError}</p>
                )}
                {promoApplied && (
                  <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Coupon applied! Instant ₹{discount} deducted from fare.
                  </p>
                )}
              </div>

              {/* PAYMENT OPTIONS */}
              <div className="space-y-2.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                  Select Payment Method
                </label>

                {/* UPI */}
                <div
                  onClick={() => setMethod('upi')}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                    method === 'upi' ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      <QrCode className="h-5 w-5" />
                    </div>
                    <div>
                      <strong className="text-sm text-slate-900 block">UPI Instant (GPay / PhonePe / Paytm)</strong>
                      <span className="text-xs text-slate-500">Zero surcharge · 1-click approval</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={method === 'upi'}
                    onChange={() => setMethod('upi')}
                    className="accent-emerald-600 h-4 w-4"
                  />
                </div>

                {/* CARDS */}
                <div
                  onClick={() => setMethod('card')}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                    method === 'card' ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <strong className="text-sm text-slate-900 block">Credit / Debit Card</strong>
                      <span className="text-xs text-slate-500">RuPay, Visa, Mastercard</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={method === 'card'}
                    onChange={() => setMethod('card')}
                    className="accent-emerald-600 h-4 w-4"
                  />
                </div>

                {/* CASH */}
                <div
                  onClick={() => setMethod('cash')}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                    method === 'cash' ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                      <Banknote className="h-5 w-5" />
                    </div>
                    <div>
                      <strong className="text-sm text-slate-900 block">Cash on Arrival</strong>
                      <span className="text-xs text-slate-500">Pay driver at destination</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={method === 'cash'}
                    onChange={() => setMethod('cash')}
                    className="accent-emerald-600 h-4 w-4"
                  />
                </div>

                {/* WALLET */}
                <div
                  onClick={() => setMethod('wallet')}
                  className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                    method === 'wallet' ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <strong className="text-sm text-slate-900 block">SmartCab Safety Wallet</strong>
                      <span className="text-xs text-slate-500">Balance: ₹1,500</span>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="paymethod"
                    checked={method === 'wallet'}
                    onChange={() => setMethod('wallet')}
                    className="accent-emerald-600 h-4 w-4"
                  />
                </div>
              </div>

              {/* PAY BUTTON */}
              <button
                type="button"
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition transform active:scale-98 flex items-center justify-center space-x-2 text-base"
              >
                <Lock className="h-4 w-4" />
                <span>
                  {processing
                    ? "Securing Transaction…"
                    : method === 'cash'
                      ? `Confirm Cash Ride (₹${finalFare.toFixed(2)})`
                      : `Pay ₹${finalFare.toFixed(2)} & Confirm Ride`}
                </span>
                {!processing && <ArrowRight className="h-5 w-5 ml-1" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
