# Zapier AI Workflow: SOW to Google Sheets Integration

## 📋 OVERVIEW
This guide configures a Zapier workflow that automatically sends every generated SOW from your system to a Google Sheets template for tracking and reporting.

## 🔧 WORKFLOW SETUP

### **STEP 1: Trigger Configuration**
**Trigger Type:** Webhook (Catch Hook)

**Webhook URL:** 
```
https://hooks.zapier.com/hooks/catch/[YOUR_ZAPIER_WEBHOOK_ID]/[YOUR_HOOK_ID]
```

**Request Method:** POST
**Data Format:** JSON

### **STEP 2: Data Mapping Configuration**

**SOW System Field → Google Sheets Column Mapping:**

