# 🇦🇺 Zebra D411 Setup Guide - Australia Client

## Your Setup

You have:
- ✅ **Zebra D411** thermal printer (Bluetooth LE only)
- ✅ **Bluetooth-to-TCP/WiFi adapter** (bridge device)
- ✅ **Tampa APP** web application

The adapter converts your Bluetooth-only printer to work over WiFi/network! 🎉

---

## 🔧 Step-by-Step Setup

### Step 1: Configure Your Bridge Adapter

The device you purchased acts as a bridge between Bluetooth and your WiFi network.

#### Common Bridge Adapters:

**If you have: Zebra ZebraNet Bridge**
1. Download **Zebra Setup Utilities** from zebra.com
2. Connect bridge to power
3. Use Zebra Setup Utilities to:
   - Connect bridge to your WiFi network
   - Pair bridge with Zebra D411 (Bluetooth)
   - Note the bridge's IP address
4. Bridge is ready! 

**If you have: USR-BLE101 or similar**
1. Download the bridge's mobile app (check manual)
2. Power on the bridge device
3. Connect your phone/tablet to bridge's WiFi hotspot
4. Open the app and configure:
   - Your WiFi network name (SSID)
   - WiFi password
   - Pair with Zebra D411
5. Bridge will reboot and connect to your network
6. Check your router's admin page for the bridge's IP address

**If you have: ESP32-based bridge**
1. Connect to bridge's web interface (usually 192.168.4.1)
2. Enter your WiFi credentials
3. Pair with Zebra D411
4. Bridge will show its IP address on the screen/web interface

---

### Step 2: Find Your Bridge's IP Address

You need to know the bridge adapter's IP address on your network.

#### Method 1: Router Admin Page
1. Log into your router (usually 192.168.1.1 or 192.168.0.1)
2. Look for "Connected Devices" or "DHCP Client List"
3. Find the bridge device (might be named "BLE-Bridge", "USR-BLE101", "ZebraNet", etc.)
4. Note the IP address (e.g., `192.168.1.150`)

#### Method 2: Network Scanner App
1. Download "Fing" app (free, iOS/Android)
2. Scan your network
3. Look for the bridge device
4. Note the IP address

#### Method 3: Bridge's Display/App
- Some bridges show their IP on an LCD screen
- Check the bridge's mobile app for IP info

**Example IP:** `192.168.1.150`

---

### Step 3: Configure Tampa APP

Now configure Tampa APP to use your Zebra D411 via the bridge adapter.

#### 3.1 Open Printer Settings

1. Open **Tampa APP** in your browser
2. Click **Settings** (⚙️ icon)
3. Click **Printer Configuration**

#### 3.2 Select Universal Printer

1. In **"Printer Type"** dropdown:
   - Select **"Universal Printer (Recommended)"** ⭐
   
2. In **"Printer Name"** field:
   - Enter: `Zebra D411 - Kitchen` (or your preferred name)

3. In **"Model"** field (optional but recommended):
   - Enter: `D411` or `Zebra D411`

4. In **"Manufacturer"** field (optional):
   - Enter: `Zebra`

#### 3.3 Configure Connection

1. Click **"Connection"** tab
2. Click the **"Bridge Adapter"** button (🔌 icon)
3. Enter your bridge's IP address:
   - **Bridge IP Address:** `192.168.1.150` (use YOUR bridge's IP!)
   - **Bridge Port:** `9100` (default, don't change unless told otherwise)
4. *Optional:* Enter bridge MAC address if you know it (helps with identification)

#### 3.4 Configure Advanced Settings

1. Click **"Advanced"** tab
2. Set:
   - **Print Darkness:** `20` (adjust if labels are too light/dark)
     - Too light? Increase to 25-30
     - Too dark? Decrease to 15-18
   - **Print Speed:** `4` (default, higher = faster)
   - **DPI:** `203` (standard for D411)
   - **Default Print Quantity:** `1`
3. Leave **"Auto-reconnect"** checked ✅
4. **Connection Timeout:** `5000` ms (5 seconds)

#### 3.5 Save Configuration

1. Click **"Save Configuration"** button (💾)
2. You should see a success message: "Settings Saved" ✅

---

### Step 4: Test Print

Time to test if everything works!

1. Go to **Labels** → **Quick Print** (or create a label)
2. Fill in label details:
   - **Product Name:** `Test Label`
   - **Prep Date:** Today's date
   - **Expiry Date:** 3 days from now
   - **Prepared By:** Your name
3. Click **"Print"** button 🖨️

**What should happen:**
1. Tampa APP sends print command over WiFi
2. Bridge adapter receives command
3. Bridge sends to Zebra D411 via Bluetooth
4. Label prints! 🎉

---

## ✅ Verification Checklist

Go through this checklist to ensure everything is set up correctly:

- [ ] Bridge adapter is powered on
- [ ] Bridge adapter's LED is solid (connected to WiFi)
- [ ] Bridge is paired with Zebra D411 (via Bluetooth)
- [ ] You know the bridge's IP address (e.g., 192.168.1.150)
- [ ] Tampa APP is configured with:
  - [ ] Printer Type: "Universal Printer"
  - [ ] Connection Type: "Bridge Adapter"
  - [ ] Bridge IP: Correct IP address entered
  - [ ] Bridge Port: 9100
- [ ] Test label printed successfully
- [ ] Label quality is good (darkness setting correct)

---

## 🛠️ Troubleshooting

### Issue: "Failed to connect to printer"

**Possible causes:**

1. **Bridge is offline**
   - Check: Is bridge powered on?
   - Check: Is bridge's LED solid (connected)?
   - Fix: Restart bridge adapter

2. **Wrong IP address**
   - Check: Did the bridge's IP change? (some routers reassign IPs)
   - Fix: Find current IP using router admin or Fing app
   - Fix: Set static IP for bridge in router settings (recommended!)

3. **Firewall blocking**
   - Check: Is port 9100 blocked by firewall?
   - Fix: Allow port 9100 in firewall settings

4. **Different WiFi networks**
   - Check: Is Tampa APP device on same WiFi as bridge?
   - Fix: Connect both to same network

**Test connection manually:**
```bash
# From Windows PowerShell:
Test-NetConnection -ComputerName 192.168.1.150 -Port 9100

# Should show: TcpTestSucceeded : True
```

---

### Issue: "Label prints but is blank"

**Possible causes:**

1. **Darkness too low**
   - Fix: Increase darkness to 25-30 in Advanced settings

2. **Wrong protocol**
   - Fix: In Basic settings, set Protocol to "ZPL" instead of "Auto"

3. **Paper not thermal**
   - Check: Are you using thermal paper? (it reacts to heat)
   - Test: Scratch paper with fingernail - should leave black mark

---

### Issue: "Label prints but formatting is wrong"

**Possible causes:**

1. **Wrong paper size**
   - Fix: In Basic settings, set:
     - Paper Width: `102` mm (for 4" x 6" labels)
     - Paper Height: `152` mm
   - For other sizes:
     - 4" x 3": Width 102mm, Height 76mm
     - 4" x 4": Width 102mm, Height 102mm

2. **Printer needs calibration**
   - Fix: Calibrate printer (see Zebra manual or use Zebra Setup Utilities)

---

### Issue: "Connection works but then drops"

**Possible causes:**

1. **Bridge timeout**
   - Fix: In Advanced settings, enable "Auto-reconnect"
   - Fix: Increase connection timeout to 10000 ms (10 seconds)

2. **WiFi signal weak**
   - Fix: Move bridge closer to WiFi router
   - Fix: Use WiFi range extender

---

## 🎯 Recommended Router Settings

To prevent connection issues, configure your router with these settings:

### Set Static IP for Bridge (Highly Recommended!)

1. Log into router admin page
2. Find DHCP settings
3. Add DHCP reservation:
   - **Device:** Your bridge adapter (find by MAC address)
   - **Reserved IP:** `192.168.1.150` (or your chosen IP)
   - **Save**

**Why?** This ensures the bridge always gets the same IP address, so Tampa APP stays connected.

### Allow Port 9100

1. Check firewall settings
2. Allow incoming/outgoing on port 9100
3. Save

---

## 📊 Configuration Summary

Here's your complete configuration for reference:

### Bridge Adapter
- **Device:** [Your bridge model]
- **WiFi Network:** [Your WiFi name]
- **IP Address:** `192.168.1.150` (example - use yours!)
- **MAC Address:** [Bridge MAC]
- **Paired with:** Zebra D411 (Bluetooth)

### Tampa APP Settings
```
Printer Type: Universal Printer (Recommended)
Printer Name: Zebra D411 - Kitchen
Model: D411
Manufacturer: Zebra
Protocol: Auto-detect

Connection Tab:
  Connection Type: Bridge Adapter
  Bridge IP Address: 192.168.1.150
  Bridge Port: 9100
  Auto-reconnect: ✅ Enabled

Advanced Tab:
  Print Darkness: 20
  Print Speed: 4
  DPI: 203 (standard)
  Paper Width: 102 mm
  Paper Height: 152 mm
  Default Quantity: 1
  Connection Timeout: 5000 ms
```

---

## 🔄 Regular Maintenance

### Weekly
- [ ] Check bridge adapter is online (LED solid)
- [ ] Test print a label to verify connection
- [ ] Check paper level in printer

### Monthly
- [ ] Clean printer rollers (use cleaning card)
- [ ] Check bridge adapter firmware for updates
- [ ] Verify static IP hasn't changed

### As Needed
- [ ] Replace thermal paper roll
- [ ] Update Tampa APP if new version available
- [ ] Adjust darkness setting if print quality changes

---

## 📞 Need Help?

If you're still having issues:

1. **Take a screenshot** of:
   - Tampa APP printer settings page
   - Bridge adapter's configuration page
   - Any error messages

2. **Note down**:
   - Bridge adapter model/brand
   - Your router model
   - IP addresses of bridge and Tampa APP device

3. **Contact support** with the above information

---

## 🎉 Success!

Once everything is working:
- ✅ Labels print reliably over WiFi
- ✅ No more Bluetooth pairing hassles
- ✅ Works from any device on your network (tablets, phones, PCs)
- ✅ Future-proof setup (easy to add more printers)

**Enjoy your automated label printing system!** 🖨️🇦🇺

---

## 📎 Additional Resources

- [Universal Printer SDK Complete Guide](./UNIVERSAL_PRINTER_SDK_GUIDE.md)
- [Zebra D411 User Manual](https://www.zebra.com/us/en/support-downloads/printers/desktop/zd411.html)
- [Tampa APP Main Documentation](../README.md)

---

**Last Updated:** February 11, 2026
**For:** Tampa APP - Australia Client
**Setup:** Zebra D411 + Bluetooth-to-TCP Bridge Adapter
