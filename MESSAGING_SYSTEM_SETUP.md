# 🎯 MCNmart Enhanced Messaging System - Complete Setup Guide

## ✅ Features Implemented

### 1. **Image Sharing in Messages**
- ✅ Upload multiple images per message
- ✅ Image preview before sending
- ✅ Full-screen image viewer
- ✅ Attachment management (add/remove)

### 2. **Auto-Delete Messages (30 Days)**
- ✅ Automatic cleanup of messages older than 30 days
- ✅ Cleanup API endpoint: `/api/messages/cleanup`
- ✅ Scheduled cleanup script: `scripts/cleanup-scheduler.js`
- ✅ System logging for cleanup activities

### 3. **Rate Limiting (30 Messages/Hour)**
- ✅ User rate limiting: 30 messages per hour
- ✅ Real-time rate limit display
- ✅ Rate limit warnings and blocking
- ✅ Rate limit utility functions

### 4. **Complete Chat Functionality**
- ✅ Real-time conversations
- ✅ Message notifications
- ✅ Online status indicators
- ✅ Search conversations
- ✅ Message timestamps
- ✅ Unread message counts

## 🚀 How to Use the Enhanced Messaging System

### **Access the Enhanced Messages**
1. Go to: `http://localhost:3000/messages-enhanced`
2. Login with your account
3. Start messaging with image support!

### **Key Features:**

#### **📷 Image Sharing:**
- Click the image icon (📷) next to the message input
- Select multiple images from your device
- Preview images before sending
- Remove unwanted images from preview
- Send images with or without text

#### **⏱️ Rate Limiting:**
- Monitor your message count in the blue info bar
- Maximum 30 messages per hour per user
- Warning when approaching limit
- Automatic blocking when limit reached

#### **🗑️ Auto-Cleanup:**
- Messages automatically deleted after 30 days
- Runs via cleanup API or scheduled script
- Maintains privacy and reduces storage

## 🔧 API Endpoints

### **Enhanced Message Sending**
```
POST /api/messages/send-enhanced
```
**Body:**
```json
{
  "recipientId": "user_id",
  "content": "Hello!",
  "attachments": [
    {
      "type": "image",
      "url": "blob:...",
      "name": "image.jpg"
    }
  ]
}
```

### **Auto-Cleanup**
```
GET /api/messages/cleanup     // Manual cleanup
POST /api/messages/cleanup    // Scheduled cleanup
```

### **Rate Limit Check**
```javascript
import { checkRateLimit } from '@/lib/rate-limiter';
const rateInfo = await checkRateLimit(userId, 30);
```

## ⚙️ Setup Instructions

### **1. Database Schema (if needed)**
The system uses existing `directMessage` and `notification` tables with the `data` field for storing attachments and metadata.

### **2. Auto-Cleanup Scheduler**
Set up a daily cron job to run the cleanup script:

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cd /path/to/your/app && node scripts/cleanup-scheduler.js
```

Or call the API endpoint daily:
```bash
# Via API call
curl -X GET http://localhost:3000/api/messages/cleanup
```

### **3. File Upload Configuration**
For production, configure proper file storage:
- Use cloud storage (AWS S3, Cloudinary, etc.)
- Update attachment URLs to use permanent storage
- Implement file size limits and validation

## 🎨 UI Components

### **Enhanced Messages Page**
- **Location:** `/messages-enhanced`
- **Features:** Full messaging interface with image support
- **Components:** Conversation list, chat window, image upload, rate limiting

### **Rate Limit Display**
- Real-time counter showing messages used/remaining
- Color-coded warnings (green → orange → red)
- Automatic UI blocking when limit reached

### **Image Attachments**
- Thumbnail previews in message bubbles
- Full-screen image viewer on click
- Multiple image support per message

## 🔒 Security Features

### **Rate Limiting**
- Prevents spam and abuse
- Per-user hourly limits
- Database-backed tracking
- Graceful error handling

### **Auto-Cleanup**
- Privacy protection via automatic deletion
- Configurable retention period
- System logging for audit trail
- Safe deletion with error handling

### **Input Validation**
- Message content validation
- File type restrictions (images only)
- Recipient verification
- Authentication requirements

## 🧪 Testing the System

### **Test Image Sharing:**
1. Go to `/messages-enhanced`
2. Select a conversation
3. Click image icon and upload photos
4. Send message with images
5. Verify images display correctly

### **Test Rate Limiting:**
1. Send 30 messages quickly
2. Observe rate limit counter
3. Try to send 31st message
4. Verify blocking and error message

### **Test Auto-Cleanup:**
1. Run: `GET /api/messages/cleanup`
2. Check console for deletion counts
3. Verify old messages are removed

## 🎉 Success Indicators

✅ **Image sharing works** - Users can send and view images
✅ **Rate limiting active** - 30 message/hour limit enforced  
✅ **Auto-cleanup running** - Old messages deleted automatically
✅ **All chat features work** - Conversations, notifications, search
✅ **No demo data** - Only real user messages displayed
✅ **Real-time updates** - Messages appear immediately

## 🔧 Troubleshooting

### **Images not uploading:**
- Check file size limits
- Verify image file types (jpg, png, gif)
- Check browser console for errors

### **Rate limiting not working:**
- Verify database connection
- Check user authentication
- Review rate limiter utility

### **Auto-cleanup not running:**
- Check cron job setup
- Verify API endpoint access
- Review database permissions

The enhanced messaging system is now complete with all requested features! 🎉
