# 🖨️ Zebra D411 Quick Setup Card

## Your Hardware
```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│  Tampa APP  │ ───> │  Bridge Adapter  │ ───> │ Zebra D411  │
│   (Tablet)  │ WiFi │ (Your new device)│  BT  │  (Printer)  │
└─────────────┘      └──────────────────┘      └─────────────┘
```

---

## ⚡ 3-Minute Setup

### 1. Setup Bridge (One Time)
- [ ] Power on bridge adapter
- [ ] Connect bridge to your WiFi
- [ ] Pair bridge with Zebra D411 (Bluetooth)
- [ ] Note bridge IP: `___.___.___.___ `

### 2. Configure Tampa APP
- [ ] Open Settings → Printer
- [ ] Select: **"Universal Printer"**
- [ ] Connection: **"Bridge Adapter"**
- [ ] Enter Bridge IP: `___.___.___.___`
- [ ] Port: `9100`
- [ ] Save ✅

### 3. Test
- [ ] Print a test label
- [ ] ✅ Success!

---

## 🔧 Quick Reference

### Tampa APP Configuration
```
┌─────────────────────────────────────┐
│ Printer Type: Universal Printer    │
│ Name: Zebra D411 - Kitchen          │
│ Model: D411                         │
│                                     │
│ Connection: Bridge Adapter          │
│ Bridge IP: 192.168.1.150           │
│ Port: 9100                          │
│                                     │
│ Darkness: 20                        │
│ Speed: 4                            │
│ Paper: 102mm x 152mm                │
└─────────────────────────────────────┘
```

### Label Sizes (Standard)
- 4" x 6" (102mm x 152mm) ⭐ Most common
- 4" x 4" (102mm x 102mm)
- 4" x 3" (102mm x 76mm)

---

## 🆘 Troubleshooting

### "Can't connect to printer"
1. ✅ Is bridge powered on?
2. ✅ Is bridge LED solid (connected)?
3. ✅ Is IP address correct?
4. ✅ Are you on the same WiFi?

**Quick Test:**
```powershell
Test-NetConnection -ComputerName 192.168.1.150 -Port 9100
```

### "Label prints blank"
1. ✅ Increase darkness to 25-30
2. ✅ Check you're using thermal paper
3. ✅ Reload paper correctly

### "Bridge IP keeps changing"
1. ✅ Set static IP in router
2. ✅ Use DHCP reservation for bridge MAC

---

## 📞 Need Help?

**Check the detailed guides:**
- `ZEBRA_D411_AUSTRALIA_SETUP.md` - Full setup guide
- `UNIVERSAL_PRINTER_SDK_GUIDE.md` - Technical docs

**Contact support with:**
- Screenshot of Tampa APP settings
- Bridge adapter model/brand
- Your bridge IP address
- Error messages (if any)

---

## ✅ Daily Use

1. **Turn on equipment:**
   - Bridge adapter (leave it on 24/7)
   - Zebra D411 printer
   - Tablet/device with Tampa APP

2. **Print labels:**
   - Just use Tampa APP normally
   - Prints automatically via bridge
   - No manual pairing needed!

3. **If issues:**
   - Check bridge is on (LED solid)
   - Restart bridge if needed
   - Tampa APP will auto-reconnect

---

## 🎯 Pro Tips

- ✅ **Set static IP** for bridge in router (prevents IP changes)
- ✅ **Leave bridge powered** on 24/7 (no need to restart daily)
- ✅ **Clean printer** monthly with cleaning card
- ✅ **Keep firmware updated** on bridge adapter
- ✅ **Test print** weekly to verify connection
- ✅ **Adjust darkness** if print quality changes (seasons affect paper)

---

**Your Configuration:** (Fill this in)
```
Bridge Brand: _______________________
Bridge IP: ___.___.___.___ 
Bridge MAC: __:__:__:__:__:__
WiFi Network: _______________________
Router IP: ___.___.___.___ 
Router Login: _______________________

Tampa APP URL: _______________________
Username: _______________________
```

---

**Setup Date:** ___________
**Tested By:** ___________
**Status:** ⬜ Working ⬜ Needs Help

---

🇦🇺 **Tampa APP - Australia**  
**Version:** 1.0 (Feb 2026)
