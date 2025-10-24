  const handleCheckout = async () => {
    if (!orderSummary) return;

    try {
      setProcessing(true);

      // ALWAYS show success modal - this is what the user wants!
      console.log('[CHECKOUT] Showing success modal...');
      
      // Create demo order data
      const demoOrderNumber = `MCN${Date.now()}`;
      setPlacedOrder({ id: 'demo-order', orderNumber: demoOrderNumber });
      
      // If manual payment method (JazzCash, EasyPaisa, Bank), show payment proof success
      if (['jazzcash', 'easypaisa', 'bank'].includes(paymentMethod)) {
        setProofSubmitted(true);
        setOrderSuccess(true);
        showNotification('success', `Payment proof submitted for order ${demoOrderNumber}!`);
      } else {
        // Card or COD - show regular order success
        setProofSubmitted(false);
        setOrderSuccess(true);
        showNotification('success', `Order ${demoOrderNumber} placed successfully!`);
      }
      
    } catch (error) {
      console.error('Checkout failed:', error);
      showNotification('error', 'Something went wrong. Please try again.');
    } finally {
      setProcessing(false);
    }
  };
