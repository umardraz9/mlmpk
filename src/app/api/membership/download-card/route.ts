import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { membershipTier, planName, planPrice } = await request.json();

    // Generate membership card HTML template
    const cardHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MCNmart Membership Card</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .card {
            width: 800px;
            height: 500px;
            background: linear-gradient(135deg, ${membershipTier === 'BASIC' ? '#10B981, #059669' : membershipTier === 'STANDARD' ? '#3B82F6, #1D4ED8' : '#8B5CF6, #7C3AED'});
            border-radius: 15px;
            color: white;
            position: relative;
            overflow: hidden;
        }
        .header {
            background: rgba(0,0,0,0.2);
            padding: 20px;
            text-align: center;
        }
        .logo { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
        .subtitle { font-size: 18px; opacity: 0.9; }
        .content {
            padding: 40px 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .left-info div { margin-bottom: 20px; font-size: 24px; font-weight: bold; }
        .right-info { text-align: right; }
        .price { font-size: 32px; font-weight: bold; }
        .duration { font-size: 16px; opacity: 0.9; }
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(255,255,255,0.9);
            color: black;
            padding: 15px;
            text-align: center;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <img src="/images/Mcnmart logo.png" alt="MCNmart.com" style="height: 40px; margin-bottom: 10px;">
            <div class="subtitle">Pakistan's Premier Social Sales Platform</div>
        </div>
        <div class="content">
            <div class="left-info">
                <div>User ID: MCN000000</div>
                <div>Referral Code: XXXXXXXX</div>
                <div>Plan: ${planName}</div>
            </div>
            <div class="right-info">
                <div class="price">${planPrice}</div>
                <div class="duration">60-day membership</div>
            </div>
        </div>
        <div class="footer">
            <div>Actual size: 3.4" x 2.1" (Credit card size)</div>
            <div>Valid for 60 days from activation date</div>
            <div>For support: contact@mcnmart.com | +92-XXX-XXXXXXX</div>
        </div>
    </div>
</body>
</html>`;

    return new NextResponse(cardHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="MCNmart-${membershipTier}-Card.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating membership card:', error);
    return NextResponse.json(
      { error: 'Failed to generate membership card' },
      { status: 500 }
    );
  }
}
