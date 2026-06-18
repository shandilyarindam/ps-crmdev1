

import os
import json
import uuid
import hashlib
import urllib.request
import urllib.parse
from datetime import datetime, timezone
from io import BytesIO
from typing import Optional
import asyncio
import base64
import httpx

from fastapi import APIRouter, Request, Response, HTTPException
from PIL import Image

# ── reuse everything from shared.py (avoids circular import) ────────────────
from shared import (
    gemini_client,
    supabase,
    GEMINI_PRIMARY_MODEL,
    GEMINI_FALLBACK_MODEL,
    CHILD_CATEGORIES,
    SEVERITY_MAP,
    upload_image_to_supabase,
    reverse_geocode_from_coordinates,
    route_authority,
    _find_active_spatial_duplicate,
    build_complaint_record,
    send_resend_email,
    build_ticket_details_url,
    redis_client,
    is_within_india,
    validate_text_quality,
    log_event,
)


# ── config ────────────────────────────────────────────────────────────────────
WHATSAPP_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "jansamadhan_verify").strip()

def get_whatsapp_token():
    return os.getenv("WHATSAPP_TOKEN", "").strip()

def get_graph_api_url():
    """Generates the URL dynamically to ensure environment changes are picked up."""
    id_val = os.getenv("WHATSAPP_PHONE_NUMBER_ID", "").strip()
    return f"https://graph.facebook.com/v22.0/{id_val}/messages"

# ── Multilingual Support (Redis & Localization) ────────────────────────────────
LANG_PREFIX = "whatsapp:language:"
LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "ta": "Tamil",
    "te": "Telugu",
    "kn": "Kannada",
    "ml": "Malayalam",
    "bn": "Bengali",
    "mr": "Marathi",
    "gu": "Gujarati",
    "pa": "Punjabi",
}

async def get_user_language(phone: str) -> Optional[str]:
    if not redis_client:
        return None
    try:
        data = redis_client.get(f"{LANG_PREFIX}{phone}")
        if data:
            return data.decode("utf-8")
    except Exception as e:
        print(f"[Redis Get Lang Error] {e}")
    return None

async def save_user_language(phone: str, lang_code: str):
    if not redis_client:
        return
    try:
        redis_client.set(f"{LANG_PREFIX}{phone}", lang_code)
    except Exception as e:
        print(f"[Redis Save Lang Error] {e}")

LOCALIZED_STRINGS = {
    "en": {
        "welcome": "🙏 *Namaste! Welcome to JanSamadhan.*\n\nI am your virtual civic assistant. How can I help you today?",
        "menu_report": "📸 Report Issue",
        "menu_report_desc": "Upload a photo to report a civic issue",
        "menu_tickets": "📋 Recent Tickets",
        "menu_tickets_desc": "Track the status of your complaints",
        "menu_stats": "📊 My Statistics",
        "menu_stats_desc": "View your total reported issues",
        "select_menu": "Main Menu ☰",
        "confirm_btn": "Confirm ✅",
        "cancel_btn": "Cancel ❌",
        "desc_too_short": "⚠️ *Description too short!*\n\nPlease describe the civic issue in more detail (minimum 10 characters).",
        "photo_received": "📸 *Photo Received!*\n\nPlease send a brief description of the issue (minimum 10 characters).",
        "analyzing": "⏳ Analyzing the issue... Please wait.",
        "content_blocked": "⛔ *Content Blocked*\n\nThis image has been flagged by our content safety filter.\nPlease only submit photos of civic infrastructure issues.\n\nSend *hi* to start again.",
        "not_civic_issue": "❌ *Not a Civic Issue*\n\n{reason}\n\nPlease send a clear photo of a civic problem (pothole, garbage, broken street light, etc.).\n\nSend *hi* to start again.",
        "issue_detected": "✅ *Issue detected:* {issue_name}\n📋 *{title}*\n🔴 Severity: {severity}{warning}\n\n📍 Please tap *Send Location* below to complete your ticket.\n(Or reply *No* to cancel report)",
        "photo_req": "📸 *Important:* I've summarized the issue, but I need a photo to proceed with the official report. Please send one now.",
        "ticket_preview": "📋 *Ticket Preview*\n━━━━━━━━━━━━━━━━━\n🔖 Issue: {issue_name}\n📌 Title: {title}\n🏛 Authority: {authority}\n👤 Councillor: {councillor}\n👤 MLA: {mla}\n🔴 Severity: {severity}\n📍 Location: {address}\n━━━━━━━━━━━━━━━━━\n\nPlease tap a button below to proceed:",
        "ticket_success": "✅ *Complaint Submitted Successfully!*\n\n🎫 Ticket ID: *{ticket_id}*\n🏛 Assigned to: {authority}\n👤 Councillor: {councillor}\n👤 MLA: {mla}\n📍 {address}\n\nYou can track your complaint at:\n🔗 {url}\n\nThank you for helping improve your city! 🙏",
        "upvote_detected": "⚠️ *Duplicate Detected*\n━━━━━━━━━━━━━━━━━\nA similar complaint already exists nearby:\n\n🎫 Ticket: *{ticket_id}*\n📍 Distance: {distance}m away\n🔄 Status: *{status}*\n\nYou can *upvote* the existing ticket to increase its priority, or *submit anyway* to create a new one.",
        "upvote_btn": "👍 Upvote",
        "submit_anyway_btn": "📝 Submit Anyway",
        "upvoted_success": "✅ *Upvoted!*\n\n🎫 Ticket: *{ticket_id}*\n🔄 Status: *{status}*\n\nYour support has been recorded. Higher upvotes = faster resolution.\nThank you for helping improve your city! 🙏",
        "upvoted_fallback": "✅ Upvoted ticket *{ticket_id}*. Thank you! 🙏",
        "upvote_fail": "❌ Failed to upvote. Please try again later.",
        "submitting": "⏳ Submitting your complaint...",
        "submit_fail": "❌ Failed to submit complaint: {e}",
        "submission_failed": "❌ Submission failed. Please try again.",
        "invalid_link_code": "❌ Invalid or expired linking code: *{code}*. Please generate a new one from the Web Portal.",
        "link_success": "✅ *Success!* Your WhatsApp number has been successfully linked to your JanSamadhan account, *{name}*.\nAll reports submitted here will now sync to your dashboard.",
        "link_error": "⚠️ Sorry, an error occurred while linking your account. Please try again later.",
        "no_recent_tickets": "You don't have any recent tickets. Send a photo to report an issue!",
        "recent_tickets_title": "📋 *Your Recent Tickets*\nHere are your last 5 reports. Tap one to view details:",
        "view_tickets_btn": "View Tickets 🔽",
        "recent_complaints_sect": "Recent Complaints",
        "my_stats_title": "📊 *My Statistics*\n\nYou have reported a total of *{count}* civic issues.\nThank you for keeping your city clean and safe! 🙏",
        "back_to_list_btn": "🔙 Back to List",
        "ticket_details": "🎫 *Ticket: {ticket_id}*\n━━━━━━━━━━━━━━━━━\n📌 *Title:* {title}\n🏛 *Authority:* {authority}\n🚦 *Status:* {status}\n🔴 *Severity:* {severity}\n📅 *Reported:* {date}\n",
        "resolution_note": "📝 *Resolution:* {note}\n",
        "status_provide_id": "Please provide a ticket ID. Example: *status DL-2026-00042*",
        "status_not_found": "❌ No ticket found with ID *{ticket_id}*.",
        "status_title": "📋 *Ticket Status*\n━━━━━━━━━━━━━━\n🎫 ID: {ticket_id}\n📌 {title}\n🏛 {authority}\n🔄 Status: *{status}*\n📅 Filed: {date}",
        "fallback_sorry": "I'm sorry, I'm only here to help with civic issues like potholes or garbage. Please send a *photo* to start a report.",
        "cancelled": "❌ Cancelled. Send *hi* to start again."
    },
    "hi": {
        "welcome": "🙏 *नमस्ते! जनसमाधान में आपका स्वागत है।*\n\nमैं आपका डिजिटल नागरिक सहायक हूँ। आज मैं आपकी क्या सहायता कर सकता हूँ?",
        "menu_report": "📸 समस्या दर्ज करें",
        "menu_report_desc": "नागरिक समस्या की रिपोर्ट करने के लिए एक फोटो अपलोड करें",
        "menu_tickets": "📋 हालिया शिकायतें",
        "menu_tickets_desc": "अपनी शिकायतों की स्थिति ट्रैक करें",
        "menu_stats": "📊 मेरे आंकड़े",
        "menu_stats_desc": "अपने कुल रिपोर्ट किए गए मुद्दों को देखें",
        "select_menu": "मुख्य मेनू ☰",
        "confirm_btn": "पुष्टि करें ✅",
        "cancel_btn": "रद्द करें ❌",
        "desc_too_short": "⚠️ *विवरण बहुत छोटा है!*\n\nकृपया समस्या का विस्तार से वर्णन करें (कम से कम 10 अक्षर)।",
        "photo_received": "📸 *फोटो प्राप्त हुई!*\n\nकृपया समस्या का एक संक्षिप्त विवरण भेजें (कम से कम 10 अक्षर)।",
        "analyzing": "⏳ समस्या का विश्लेषण किया जा रहा है... कृपया प्रतीक्षा करें।",
        "content_blocked": "⛔ *सामग्री अवरुद्ध*\n\nइस छवि को हमारे सुरक्षा फ़िल्टर द्वारा चिह्नित किया गया है।\nकृपया केवल नागरिक बुनियादी ढांचे से संबंधित मुद्दों की तस्वीरें भेजें।\n\nफिर से शुरू करने के लिए *hi* भेजें।",
        "not_civic_issue": "❌ *नागरिक समस्या नहीं है*\n\n{reason}\n\nकृपया किसी नागरिक समस्या (गड्ढा, कचरा, टूटी स्ट्रीट लाइट, आदि) की स्पष्ट तस्वीर भेजें।\n\nफिर से शुरू करने के लिए *hi* भेजें।",
        "issue_detected": "✅ *समस्या की पहचान:* {issue_name}\n📋 *{title}*\n🔴 गंभीरता: {severity}{warning}\n\n📍 अपना टिकट पूरा करने के लिए नीचे *स्थान साझा करें* पर टैप करें।\n(या रद्द करने के लिए *No* भेजें)",
        "photo_req": "📸 *महत्वपूर्ण:* मैंने समस्या का सारांश तैयार कर लिया है, लेकिन मुझे आधिकारिक रिपोर्ट दर्ज करने के लिए एक फोटो की आवश्यकता है। कृपया अब एक भेजें।",
        "ticket_preview": "📋 *टिकट पूर्वावलोकन*\n━━━━━━━━━━━━━━━━━\n🔖 समस्या: {issue_name}\n📌 शीर्षक: {title}\n🏛 विभाग: {authority}\n👤 पार्षद: {councillor}\n👤 विधायक: {mla}\n🔴 गंभीरता: {severity}\n📍 स्थान: {address}\n━━━━━━━━━━━━━━━━━\n\nकृपया आगे बढ़ने के लिए नीचे दिए गए बटन पर टैप करें:",
        "ticket_success": "✅ *शिकायत सफलतापूर्वक दर्ज की गई!*\n\n🎫 टिकट आईडी: *{ticket_id}*\n🏛 विभाग: {authority}\n👤 पार्षद: {councillor}\n👤 विधायक: {mla}\n📍 {address}\n\nआप अपनी शिकायत को यहाँ ट्रैक कर सकते हैं:\n🔗 {url}\n\nशहर को बेहतर बनाने में मदद करने के लिए धन्यवाद! 🙏",
        "upvote_detected": "⚠️ *समान शिकायत मिली*\n━━━━━━━━━━━━━━━━━\nपास में ही एक समान शिकायत पहले से मौजूद है:\n\n🎫 टिकट: *{ticket_id}*\n📍 दूरी: {distance}m दूर\n🔄 स्थिति: *{status}*\n\nआप प्राथमिकता बढ़ाने के लिए मौजूदा टिकट का *समर्थन (Upvote)* कर सकते हैं, या नई शिकायत बनाने के लिए *वैसे भी सबमिट करें*।",
        "upvote_btn": "👍 समर्थन करें",
        "submit_anyway_btn": "📝 वैसे भी सबमिट करें",
        "upvoted_success": "✅ *समर्थित!*\n\n🎫 टिकट: *{ticket_id}*\n🔄 स्थिति: *{status}*\n\nआपका समर्थन दर्ज कर लिया गया है। अधिक समर्थन = त्वरित समाधान।\nशहर को बेहतर बनाने में मदद करने के लिए धन्यवाद! 🙏",
        "upvoted_fallback": "✅ टिकट *{ticket_id}* को समर्थन दिया गया। धन्यवाद! 🙏",
        "upvote_fail": "❌ समर्थन करने में विफल। कृपया बाद में पुनः प्रयास करें।",
        "submitting": "⏳ आपकी शिकायत सबमिट की जा रही है...",
        "submit_fail": "❌ शिकायत सबमिट करने में विफल: {e}",
        "submission_failed": "❌ सबमिशन विफल रहा। कृपया पुनः प्रयास करें।",
        "invalid_link_code": "❌ अमान्य या समाप्त हो चुका लिंकिंग कोड: *{code}*। कृपया वेब पोर्टल से एक नया कोड उत्पन्न करें।",
        "link_success": "✅ *सफलता!* आपका व्हाट्सएप नंबर आपके जनसमाधान खाते, *{name}* से सफलतापूर्वक लिंक हो गया है।\nयहाँ सबमिट की गई सभी शिकायतें अब आपके डैशबोर्ड पर दिखाई देंगी।",
        "link_error": "⚠️ क्षमा करें, आपका खाता लिंक करने में त्रुटि हुई। कृपया बाद में पुनः प्रयास करें।",
        "no_recent_tickets": "आपके पास कोई हालिया टिकट नहीं है। शिकायत दर्ज करने के लिए एक फोटो भेजें!",
        "recent_tickets_title": "📋 *आपकी हालिया शिकायतें*\nये आपकी अंतिम 5 रिपोर्ट हैं। विवरण देखने के लिए एक पर टैप करें:",
        "view_tickets_btn": "टिकट देखें 🔽",
        "recent_complaints_sect": "हालिया शिकायतें",
        "my_stats_title": "📊 *मेरे आंकड़े*\n\nआपने कुल *{count}* नागरिक समस्याओं की रिपोर्ट की है।\nअपने शहर को साफ और सुरक्षित रखने के लिए धन्यवाद! 🙏",
        "back_to_list_btn": "🔙 सूची पर वापस जाएं",
        "ticket_details": "🎫 *टिकट: {ticket_id}*\n━━━━━━━━━━━━━━━━━\n📌 *शीर्षक:* {title}\n🏛 *विभाग:* {authority}\n🚦 *स्थिति:* {status}\n🔴 *गंभीरता:* {severity}\n📅 *रिपोर्ट दिनांक:* {date}\n",
        "resolution_note": "📝 *समाधान टिप्पणी:* {note}\n",
        "status_provide_id": "कृपया टिकट आईडी प्रदान करें। उदाहरण: *status DL-2026-00042*",
        "status_not_found": "❌ आईडी *{ticket_id}* के साथ कोई टिकट नहीं मिला।",
        "status_title": "📋 *टिकट की स्थिति*\n━━━━━━━━━━━━━━\n🎫 आईडी: {ticket_id}\n📌 {title}\n🏛 {authority}\n🔄 स्थिति: *{status}*\n📅 दायर किया गया: {date}",
        "fallback_sorry": "क्षमा करें, मैं केवल गड्ढों या कचरे जैसी नागरिक समस्याओं में मदद कर सकता हूँ। रिपोर्ट शुरू करने के लिए कृपया एक *फोटो* भेजें।",
        "cancelled": "❌ रद्द कर दिया गया। फिर से शुरू करने के लिए *hi* भेजें।"
    }
}

async def send_language_selection(phone: str):
    """Sends a WhatsApp List message allowing the user to select their language."""
    await send_list_message(
        phone=phone,
        body_text="👋 Welcome to JanSamadhan / जनसमाधान में आपका स्वागत है!\n\nPlease select your preferred language / कृपया अपनी भाषा चुनें:",
        button_text="Select Language 🌐",
        sections=[
            {
                "title": "Available Languages",
                "rows": [
                    {"id": "lang_en", "title": "English", "description": "Use English for chat"},
                    {"id": "lang_hi", "title": "हिन्दी (Hindi)", "description": "चैट के लिए हिंदी का उपयोग करें"},
                    {"id": "lang_ta", "title": "தமிழ் (Tamil)", "description": "தமிழில் தொடਰவும்"},
                    {"id": "lang_te", "title": "తెలుగు (Telugu)", "description": "తెలుగులో చాట్ చేయండి"},
                    {"id": "lang_kn", "title": "ಕನ್ನಡ (Kannada)", "description": "ಕನ್ನಡದಲ್ಲಿ ਚਾਟ ਕਰੋ"},
                    {"id": "lang_ml", "title": "മലയാളം (Malayalam)", "description": "മലയാളം ഉപയോഗിക്കുക"},
                    {"id": "lang_bn", "title": "বাংলা (Bengali)", "description": "বাংলায় চ্যাট করুন"},
                    {"id": "lang_mr", "title": "मराठी (Marathi)", "description": "मराठी मध्ये सुरू ठेवा"},
                    {"id": "lang_gu", "title": "ગુજરાતી (Gujarati)", "description": "ગુજરાતી માં ચેટ કરો"},
                    {"id": "lang_pa", "title": "ਪੰਜਾਬੀ (Punjabi)", "description": "ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲਬਾਤ ਕਰੋ"},
                ]
            }
        ]
    )

async def trigger_localized_menu(phone: str, lang_code: str):
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])
    await send_list_message(
        phone=phone,
        body_text=strings["welcome"],
        button_text=strings["select_menu"],
        sections=[
            {
                "title": strings["menu_report"],
                "rows": [
                    {
                        "id": "menu_report_issue",
                        "title": strings["menu_report"],
                        "description": strings["menu_report_desc"]
                    }
                ]
            },
            {
                "title": strings["menu_tickets"],
                "rows": [
                    {
                        "id": "menu_recent_tickets",
                        "title": strings["menu_tickets"],
                        "description": strings["menu_tickets_desc"]
                    },
                    {
                        "id": "menu_my_stats",
                        "title": strings["menu_stats"],
                        "description": strings["menu_stats_desc"]
                    }
                ]
            }
        ]
    )

# Redis Keys
SESSION_PREFIX = "whatsapp:session:"
SESSION_TTL = 3600  # 1 hour

async def get_session(phone: str) -> dict:
    if not redis_client:
        return {}
    try:
        data = redis_client.get(f"{SESSION_PREFIX}{phone}")
        if not data:
            return {}
        session = json.loads(data)
        # Decode image_bytes if present (stored as base64 string)
        if "image_bytes" in session and session["image_bytes"]:
            session["image_bytes"] = base64.b64decode(session["image_bytes"])
        return session
    except Exception as e:
        print(f"[Redis Get Error] {e}")
        return {}

async def save_session(phone: str, session: dict):
    if not redis_client:
        return
    try:
        # Clone to avoid mutating original
        data_to_store = session.copy()
        # Encode image_bytes if present
        if "image_bytes" in data_to_store and isinstance(data_to_store["image_bytes"], bytes):
            data_to_store["image_bytes"] = base64.b64encode(data_to_store["image_bytes"]).decode("utf-8")
        
        redis_client.setex(
            f"{SESSION_PREFIX}{phone}",
            SESSION_TTL,
            json.dumps(data_to_store)
        )
    except Exception as e:
        print(f"[Redis Save Error] {e}")

async def delete_session(phone: str):
    if redis_client:
        redis_client.delete(f"{SESSION_PREFIX}{phone}")

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


# ═══════════════════════════════════════════════════════════════════════════════
# 1. WEBHOOK VERIFICATION  (Meta calls this once when you save the webhook URL)
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/webhook")
async def verify_webhook(request: Request):
    params = dict(request.query_params)
    mode      = params.get("hub.mode")
    token     = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    if mode == "subscribe" and token == WHATSAPP_VERIFY_TOKEN:
        return Response(content=challenge, media_type="text/plain")

    raise HTTPException(status_code=403, detail="Webhook verification failed")


# ═══════════════════════════════════════════════════════════════════════════════
# 2. INCOMING MESSAGE HANDLER
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/webhook")
async def receive_message(request: Request):
    body = await request.json()

    try:
        entry    = body["entry"][0]
        changes  = entry["changes"][0]
        value    = changes["value"]
        messages = value.get("messages")
        if not messages:
            return {"status": "no_message"}

        msg    = messages[0]
        from_  = msg["from"]          # sender's WhatsApp number
        msg_id = msg["id"]
        mtype  = msg.get("type")

        if mtype == "text":
            raw_text = msg["text"]["body"].strip()
            await handle_text(from_, raw_text)

        elif mtype == "image":
            image_id = msg["image"]["id"]
            caption = msg["image"].get("caption", "").strip()
            await handle_image(from_, image_id, caption)

        elif mtype == "location":
            lat = msg["location"]["latitude"]
            lng = msg["location"]["longitude"]
            await handle_location(from_, lat, lng)

        elif mtype == "interactive":
            itype = msg["interactive"]["type"]
            if itype == "button_reply":
                button_id = msg["interactive"]["button_reply"]["id"]
                # Route button replies to handle_text to reuse existing logic
                if button_id == "confirm_ticket":
                    await handle_text(from_, "confirm")
                elif button_id == "cancel_ticket":
                    await handle_text(from_, "cancel")
                elif button_id == "upvote_existing":
                    await handle_text(from_, "upvote")
                elif button_id == "force_submit":
                    await handle_text(from_, "submit anyway")
            elif itype == "list_reply":
                list_id = msg["interactive"]["list_reply"]["id"]
                await handle_list_selection(from_, list_id)

        else:
            await send_text(from_, "Sorry, I only understand text messages, images, and locations right now.")

    except Exception as e:
        print(f"[WhatsApp webhook error] {e}")

    # Always return 200 so Meta doesn't retry
    return {"status": "ok"}


# ═══════════════════════════════════════════════════════════════════════════════
# 3. TEXT HANDLER
# ═══════════════════════════════════════════════════════════════════════════════

async def handle_text(phone: str, raw_text: str):
    session = await get_session(phone)
    text = raw_text.lower()  # lowercase for command matching only

    # Retrieve user language and localized strings
    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    # ── greeting ──────────────────────────────────────────────────────────────
    if text in ("hi", "hello", "hey", "start", "namaste", "menu", "help", "language", "lang"):
        await delete_session(phone)
        saved_lang = await get_user_language(phone)
        if text in ("start", "language", "lang") or not saved_lang:
            await send_language_selection(phone)
        else:
            await trigger_localized_menu(phone, saved_lang)
        return

    # ── awaiting description flow ─────────────────────────────────────────────
    if session.get("state") == "awaiting_description" and session.get("pending_image_id"):
        # Resume the handle_image flow with the ORIGINAL case text (not lowered)
        await handle_image(phone, session["pending_image_id"], caption=raw_text)
        return

    # ── confirm ticket ─────────────────────────────────────────────────────────
    if text in ("confirm", "submit", "yes", "haan", "ok", "पुष्टि", "हाँ", "हा", "सत्य") and session.get("preview"):
        await confirm_ticket(phone, session)
        return

    # ── edit / change intent ──────────────────────────────────────────────────
    if (text in ("edit", "change", "wrong", "galat") or "change category" in text) and session.get("state") == "awaiting_location":
        await send_text(phone, "No problem! Please tell me what the correct category should be, or describe the issue again.")
        session["state"] = "editing_details"
        session["fallback_count"] = 0
        await save_session(phone, session)
        return

    if session.get("state") == "editing_details":
        # Here we could run Gemini again with the new text, 
        # but for simplicity let's just ask them to send a new photo or reset.
        await send_text(phone, "Got it. Please send a new photo and I will re-analyze it for you.")
        await delete_session(phone)
        return

    # ── upvote existing duplicate ──────────────────────────────────────────────
    if text in ("upvote", "support", "same", "समर्थन") and session.get("duplicate"):
        await upvote_duplicate(phone, session)
        return

    # ── force submit despite duplicate ─────────────────────────────────────────
    if text in ("force", "submit anyway", "yes again") and session.get("preview") and session.get("duplicate"):
        session["force_submit"] = True
        await save_session(phone, session)
        await confirm_ticket(phone, session)
        return

    # ── cancel ────────────────────────────────────────────────────────────────
    if text in ("cancel", "no", "nahi", "reset", "रद्द", "नही", "नहीं", "ना"):
        await delete_session(phone)
        await send_text(phone, strings["cancelled"])
        return

    # ── status check ──────────────────────────────────────────────────────────
    if text.startswith("status"):
        parts = text.split()
        ticket_id = parts[1].upper() if len(parts) > 1 else None
        await check_status(phone, ticket_id)
        return

    # ── account linking ───────────────────────────────────────────────────────
    if text.startswith("link-"):
        code = text.upper()
        await link_whatsapp_account(phone, code)
        return

    # ── fallback: AI Conversation & Issue Extraction ──────────────────────────
    # If not a command, we give the text to Gemini.
    # Architecture: User can describe via text to "get context", but MUST provide photo to submit.
    
    # Enforce minimum 10-character description for WhatsApp bot fallback flow
    if len(raw_text.strip()) < 10:
        await send_text(phone, "⚠️ *Description too short!*\n\nPlease describe the civic issue in more detail (minimum 10 characters).")
        return

    # Check if we already have an image in session
    has_image = bool(session.get("image_bytes"))
    
    # Collect history (simulated from fallback_count or simple session)
    # For now, we'll just send the current text with a system prompt.
    # In a full impl, we'd store last 5 messages in Redis.
    
    try:
        from google.genai import types as genai_types
        from shared import CHILD_CATEGORIES
        child_list = "\n".join([f"{id}: {c['name']}" for id, c in CHILD_CATEGORIES.items()])
        
        # System prompt for WhatsApp (parities with Web lib/gemini.ts)
        prompt = f"""You are JanSamadhan AI, a helpful civic complaint assistant for Delhi municipal services.
Your job: Summarize the user's issue and output structured JSON.

REQUIRED FIELDS:
- title (5-10 word summary)
- child_id (integer from the taxonomy below)
- severity (Low|Medium|High|Critical)
- description (2-3 sentences)
- confidence (float between 0 and 1)

CATEGORIES:
{child_list}

CIVIC FOCUS & SAFETY RULES:
1. Greet warmly on the first message.
2. If the user says something unrelated to civic problems (fun talk, jokes), politely steer them back.
3. PHOTO MANDATE: A photo is REQUIRED for final submission. If 'has_image' is false, you MUST include a reminder in your "reply".

Extraction Mode (Only when you have all details):
Return ONLY JSON:
{{
  "extracted": {{ "title": "...", "child_id": 12, "severity": "...", "description": "...", "confidence": 0.0 }},
  "reply": "[Friendly summary]. [If no image: Please send a photo to proceed], then we can submit."
}}
"""
        # Create config with system_instruction and temperature 0
        config = genai_types.GenerateContentConfig(
            system_instruction=prompt,
            temperature=0.0
        )
        
        # Call Gemini (text-only)
        for model_name in [GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL]:
            try:
                response = gemini_client.models.generate_content(
                    model=model_name,
                    contents=[
                        f"User Input: {raw_text}",
                        f"Has Image in Session: {has_image}"
                    ],
                    config=config
                )
                text_raw = response.text.strip()
                if "```json" in text_raw:
                    text_raw = text_raw.split("```json")[1].split("```")[0].strip()
                elif "```" in text_raw:
                    text_raw = text_raw.split("```")[1].split("```")[0].strip()
                
                res_json = json.loads(text_raw)
                extracted = res_json.get("extracted")
                bot_reply = res_json.get("reply", "I've noted that.")
                
                if extracted and extracted.get("confidence", 0) > 0.7:
                    # Enforce Photo Mandate
                    if not has_image:
                        # Store extracted but don't proceed to location
                        session.update({
                            "extracted_from_text": extracted,
                            "state": "awaiting_photo",
                            "fallback_count": 0
                        })
                        await save_session(phone, session)
                        await send_text(phone, f"{bot_reply}\n\n📸 *Important:* I've summarized the issue, but I need a photo to proceed with the official report. Please send one now.")
                        return
                    else:
                        # Already have image! Build preview and proceed to location
                        # (Reuse image analysis logic but with these text details)
                        session.update({
                            "gemini_result": {
                                "child_id": extracted["child_id"],
                                "title": extracted["title"],
                                "description": extracted["description"],
                                "severity": extracted["severity"],
                                "confidence": extracted["confidence"]
                            },
                            "state": "awaiting_location",
                            "fallback_count": 0
                        })
                        await save_session(phone, session)
                        # Now trigger location request
                        await handle_image_completion_location_flow(phone, session)
                        return
                else:
                    # Just a chat/reply
                    await send_text(phone, bot_reply)
                    count = session.get("fallback_count", 0) + 1
                    session["fallback_count"] = count
                    await save_session(phone, session)
                    return
            except Exception as e:
                print(f"[Gemini Text Flow Error] {e}")
                continue

    except Exception as e:
        print(f"[WhatsApp Chat Flow Error] {e}")

    await send_text(phone,
        "I'm sorry, I'm only here to help with civic issues like potholes or garbage. Please send a *photo* to start a report."
    )


async def handle_image_completion_location_flow(phone: str, session: dict):
    """Helper to trigger the location request after an image is confirmed/extracted."""
    result = session["gemini_result"]
    category = CHILD_CATEGORIES[result["child_id"]]
    await send_location_request(phone, 
        f"✅ *Issue Identified:* {category['name']}\n\n"
        f"To submit this report, I need your location. Please tap the button below to share it."
    )


async def link_whatsapp_account(phone: str, code: str):
    """Links the WhatsApp phone number to the profile that matches the generated linking code."""
    db_phone = f"+{phone}" if not phone.startswith("+") else phone
    try:
        # Find the profile with this code
        resp = supabase.table("profiles").select("id, full_name").eq("whatsapp_link_code", code).execute()
        if not resp.data:
            await send_text(phone, f"❌ Invalid or expired linking code: *{code}*. Please generate a new one from the Web Portal.")
            return

        user_id = resp.data[0]["id"]
        full_name = resp.data[0].get("full_name") or "Citizen"

        # Update the profile with the phone number and clear the code to prevent reuse
        update_resp = supabase.table("profiles").update({
            "phone": db_phone,
            "whatsapp_link_code": None
        }).eq("id", user_id).execute()

        await send_text(phone, f"✅ *Success!* Your WhatsApp number has been successfully linked to your JanSamadhan account, *{full_name}*.\nAll reports submitted here will now sync to your dashboard.")
        
    except Exception as e:
        print(f"[link error] {e}")
        await send_text(phone, "⚠️ Sorry, an error occurred while linking your account. Please try again later.")


async def handle_list_selection(phone: str, list_id: str):
    """Routes the selected list item ID from WhatsApp interactive lists."""
    if list_id.startswith("lang_"):
        lang_code = list_id.replace("lang_", "")
        await save_user_language(phone, lang_code)
        await trigger_localized_menu(phone, lang_code)
        return

    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    if list_id == "menu_report_issue":
        prompt_text = "📸 *Report an Issue*\nPlease send a clear photo of the civic issue (pothole, garbage, etc.) to get started."
        if lang_code == "hi":
            prompt_text = "📸 *समस्या दर्ज करें*\nकृपया शुरू करने के लिए नागरिक समस्या (गड्ढा, कचरा आदि) की एक स्पष्ट तस्वीर भेजें।"
        await send_text(phone, prompt_text)
    elif list_id == "menu_recent_tickets":
        await handle_action_recent_tickets(phone)
    elif list_id == "menu_my_stats":
        await handle_action_stats(phone)
    elif list_id.startswith("view_ticket_"):
        ticket_id = list_id.replace("view_ticket_", "")
        await show_ticket_details(phone, ticket_id)
    else:
        await send_text(phone, "Invalid selection.")


async def get_citizen_id(phone: str) -> str:
    db_phone = f"+{phone}" if not phone.startswith("+") else phone
    try:
        resp = supabase.table("profiles").select("id").eq("phone", db_phone).execute()
        if resp.data and len(resp.data) > 0:
            return resp.data[0]["id"]
    except Exception as e:
        print("[auth error]", e)
    return os.getenv("WHATSAPP_BOT_USER_ID", "00000000-0000-0000-0000-000000000000")


async def handle_action_recent_tickets(phone: str):
    citizen_id = await get_citizen_id(phone)
    resp = supabase.table("complaints").select("id, ticket_id, title, status").eq("citizen_id", citizen_id).order("created_at", desc=True).limit(5).execute()
    
    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    if not resp.data:
        await send_text(phone, strings["no_recent_tickets"])
        return

    rows = []
    for t in resp.data:
        status_raw = str(t['status'])
        status_clean = status_raw.replace('_', ' ').title()
        if lang_code == "hi":
            status_clean = {
                "submitted": "प्रस्तुत",
                "under_review": "समीक्षा के तहत",
                "assigned": "आवंटित",
                "in_progress": "प्रगति पर",
                "pending_closure": "बंद होने का इंतजार",
                "resolved": "हल किया गया",
                "rejected": "अस्वीकृत",
                "escalated": "तेज किया गया",
                "reopened": "फिर से खोला गया",
                "spam": "स्पैम"
            }.get(status_raw, status_clean)

        title_str = f"[{status_clean}]"[:24]
        desc_str = str(t['title'])[:72]
        
        rows.append({
            "id": f"view_ticket_{t['ticket_id']}",
            "title": title_str,
            "description": desc_str
        })

    await send_list_message(
        phone=phone,
        body_text=strings["recent_tickets_title"],
        button_text=strings["view_tickets_btn"],
        sections=[{"title": strings["recent_complaints_sect"], "rows": rows}]
    )


async def handle_action_stats(phone: str):
    citizen_id = await get_citizen_id(phone)
    resp = supabase.table("complaints").select("id", count="exact").eq("citizen_id", citizen_id).execute()
    count = resp.count or 0

    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    body = strings["my_stats_title"].format(count=count)
    await send_button_message(phone,
        body,
        [{"id": "menu_recent_tickets", "title": strings["back_to_list_btn"]}]
    )


async def show_ticket_details(phone: str, ticket_id_str: str):
    resp = supabase.table("complaints").select("*").eq("ticket_id", ticket_id_str).execute()
    
    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    if not resp.data:
        await send_text(phone, strings["status_not_found"].format(ticket_id=ticket_id_str))
        return
        
    t = resp.data[0]
    status_raw = str(t['status'])
    status_clean = status_raw.replace('_', ' ').title()
    severity_lbl = str(t['severity'])

    if lang_code == "hi":
        status_clean = {
            "submitted": "प्रस्तुत",
            "under_review": "समीक्षा के तहत",
            "assigned": "आवंटित",
            "in_progress": "प्रगति पर",
            "pending_closure": "बंद होने का इंतजार",
            "resolved": "हल किया गया",
            "rejected": "अस्वीकृत",
            "escalated": "तेज किया गया",
            "reopened": "फिर से खोला गया",
            "spam": "स्पैम"
        }.get(status_raw, status_clean)

        severity_lbl = {
            "Low": "कम",
            "Medium": "मध्यम",
            "High": "उच्च",
            "Critical": "गंभीर"
        }.get(severity_lbl, severity_lbl)

    body = strings["ticket_details"].format(
        ticket_id=t['ticket_id'],
        title=t['title'],
        authority=t.get('assigned_department') or 'Pending',
        status=status_clean,
        severity=severity_lbl,
        date=str(t['created_at'])[:10]
    )
    if t.get('resolution_note'):
        body += strings["resolution_note"].format(note=t['resolution_note'])

    body += "━━━━━━━━━━━━━━━━━"
    await send_button_message(phone, body, [{"id": "menu_recent_tickets", "title": strings["back_to_list_btn"]}])


# ═══════════════════════════════════════════════════════════════════════════════
# 4. IMAGE HANDLER  –  download → Gemini analyze → send preview
# ═══════════════════════════════════════════════════════════════════════════════


async def handle_image(phone: str, image_id: str, caption: str = ""):
    session = await get_session(phone)
    
    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    # Check if we were specifically waiting for a photo for an already described issue
    extracted_text = session.get("extracted_from_text")
    if not caption and extracted_text and session.get("state") == "awaiting_photo":
        # Use the previously extracted description
        caption = extracted_text.get("description", "")
        print(f"[WhatsApp] Resuming from awaiting_photo state. Using description: {caption[:50]}...")

    # 1. Enforce minimum 10-character description for WhatsApp bot
    clean_caption = caption.strip() if caption else ""
    if len(clean_caption) < 10:
        session.update({
            "pending_image_id": image_id,
            "state": "awaiting_description",
            "fallback_count": 0
        })
        await save_session(phone, session)
        if clean_caption:
            await send_text(phone, strings["desc_too_short"])
        else:
            await send_text(phone, strings["photo_received"])
        return

    await send_text(phone, strings["analyzing"])

    # 2. Download image bytes from Meta
    try:
        image_bytes = await download_whatsapp_media(image_id)
    except Exception as e:
        await send_text(phone, f"❌ Could not download image: {e}")
        return

    # 3. Convert to PIL for Gemini
    try:
        pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception:
        await send_text(phone, "❌ Could not read image. Please send a clear JPEG or PNG.")
        return

    # 4. Run Gemini classification
    try:
        # Use caption as context for Gemini
        result = await classify_image_with_gemini(pil_image, user_text=caption, language=lang_code)
    except Exception as e:
        await send_text(phone, f"❌ AI analysis failed: {e}")
        return

    # 3b. Handle safety gate decisions
    decision = result.get("decision", "valid_issue")

    if decision == "explicit_blocked":
        log_event("whatsapp_rejected", level="WARNING", reason_code="AI_SAFETY_BLOCKED", payload={"phone": phone})
        await send_text(phone, strings["content_blocked"])
        await delete_session(phone)
        return

    if decision == "non_civic_rejected":
        reason = result.get("decision_reason", "This image doesn't appear to show a civic issue.")
        log_event("whatsapp_rejected", level="INFO", reason_code="NON_CIVIC_ISSUE", payload={"phone": phone, "reason": reason})
        await send_text(phone, strings["not_civic_issue"].format(reason=reason))
        await delete_session(phone)
        return

    # 3c. Check confidence threshold
    confidence = result.get("confidence", 0.8)
    confidence_warning = ""
    if confidence < 0.6:
        if lang_code == "hi":
            confidence_warning = "\n⚠️ _मुझे इस फ़ोटो से समस्या की पहचान करने में थोड़ी कठिनाई हो रही है। क्या आप विवरण दे सकते हैं कि क्या गलत है? (जैसे क्या हुआ और यह कितना जरूरी है)_\n"
        else:
            confidence_warning = "\n⚠️ _I'm having a bit of trouble identifying the problem from this photo. Could you please describe what's wrong? (Include details like what happened and how urgent it is)_\n"

    # 4. Store image + result in session; ask for location
    session = await get_session(phone)
    session.update({
        "image_bytes": image_bytes,
        "gemini_result": result,
        "state": "awaiting_location",
        "fallback_count": 0
    })
    await save_session(phone, session)

    severity_lbl = result["severity"]
    if lang_code == "hi":
        severity_lbl = {
            "Low": "कम",
            "Medium": "मध्यम",
            "High": "उच्च",
            "Critical": "गंभीर"
        }.get(severity_lbl, severity_lbl)

    await send_location_request(phone,
        strings["issue_detected"].format(
            issue_name=result['issue_name'],
            title=result['title'],
            severity=severity_lbl,
            warning=confidence_warning
        )
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 5. LOCATION HANDLER  –  finalize preview, prompt to confirm
# ═══════════════════════════════════════════════════════════════════════════════

async def handle_location(phone: str, lat: float, lng: float):
    session = await get_session(phone)

    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    # 1. Boundary Check (India only)
    if not is_within_india(lat, lng):
        log_event("whatsapp_rejected", level="WARNING", reason_code="GEO_OOB", payload={"phone": phone, "lat": lat, "lng": lng})
        out_of_bounds_msg = "📍 *Out of Bounds*\n\nJanSamadhan is currently only available for issues within India. Please report problems from a valid location in India."
        if lang_code == "hi":
            out_of_bounds_msg = "📍 *सीमा से बाहर*\n\nजनसमाधान वर्तमान में केवल भारत के भीतर के मुद्दों के लिए उपलब्ध है। कृपया भारत में किसी मान्य स्थान से समस्याओं की रिपोर्ट करें।"
        await send_text(phone, out_of_bounds_msg)
        await delete_session(phone)
        return

    if session.get("state") != "awaiting_location":
        await_msg = "Please send a *photo* of the issue first, then share your location."
        if lang_code == "hi":
            await_msg = "कृपया पहले समस्या की एक *फ़ोटो* भेजें, फिर अपना स्थान साझा करें।"
        await send_text(phone, await_msg)
        return

    result       = session["gemini_result"]
    image_bytes  = session["image_bytes"]

    # Reverse geocode
    try:
        location = reverse_geocode_from_coordinates(lat, lng)
    except Exception:
        location = {
            "pincode": "000000", "locality": "Unknown", "city": "Delhi",
            "district": "Delhi", "state": "Delhi",
            "formatted_address": f"Lat {lat:.5f}, Lng {lng:.5f}", "digipin": ""
        }

    # Route authority using location (so preview matches what gets saved)
    category = CHILD_CATEGORIES[result["child_id"]]
    routed_authority = route_authority(
        issue_type=category["name"],
        latitude=lat,
        longitude=lng,
        location=location,
        default_authority=category["authority"],
    )

    # Build preview
    preview = {
        "child_id":    result["child_id"],
        "issue_name":  result["issue_name"],
        "authority":   routed_authority,
        "title":       result["title"],
        "description": result["description"],
        "severity":    result["severity"],
        "severity_db": result["severity_db"],
        "latitude":    lat,
        "longitude":   lng,
        "location":    location,
    }

    session.update({"preview": preview, "state": "awaiting_confirm"})
    await save_session(phone, session)

    address_short = location.get("locality") or location.get("formatted_address", "")[:60]
    
    severity_lbl = result["severity"]
    if lang_code == "hi":
        severity_lbl = {
            "Low": "कम",
            "Medium": "मध्यम",
            "High": "उच्च",
            "Critical": "गंभीर"
        }.get(severity_lbl, severity_lbl)

    councillor_name = location.get("councillor_name", "")
    councillor_party = location.get("councillor_party", "")
    councillor_str = f"{councillor_name} ({councillor_party})" if councillor_name else "Not Available"

    mla_name = location.get("mla_name", "")
    mla_party = location.get("mla_party", "")
    mla_str = f"{mla_name} ({mla_party})" if mla_name else "Not Available"

    preview_body = strings["ticket_preview"].format(
        issue_name=result['issue_name'],
        title=result['title'],
        authority=routed_authority,
        councillor=councillor_str,
        mla=mla_str,
        severity=severity_lbl,
        address=address_short
    )

    await send_button_message(phone,
        preview_body,
        [
            {"id": "confirm_ticket", "title": strings["confirm_btn"]},
            {"id": "cancel_ticket", "title": strings["cancel_btn"]}
        ]
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 6. CONFIRM  –  write to Supabase
# ═══════════════════════════════════════════════════════════════════════════════

async def confirm_ticket(phone: str, session: dict):
    preview = session["preview"]

    lat      = preview["latitude"]
    lng      = preview["longitude"]
    location = preview["location"]
    child_id = preview["child_id"]
    category = CHILD_CATEGORIES[child_id]
    force_submit = session.get("force_submit", False)

    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    # ── Duplicate pre-check: block and offer upvote (matches web behavior) ──
    duplicate = _find_active_spatial_duplicate(category_id=child_id, latitude=lat, longitude=lng)
    if duplicate and not force_submit:
        # Store duplicate info in session for upvote/force flow
        session.update({"duplicate": duplicate, "state": "awaiting_duplicate_action"})
        await save_session(phone, session)
        dup_ticket_id = duplicate.get("ticket_id", "Unknown")
        dup_distance = duplicate.get("distance_m", "?")
        dup_status = str(duplicate.get("status", "active")).replace("_", " ").title()

        dup_status_lbl = dup_status
        if lang_code == "hi":
            dup_status_lbl = {
                "submitted": "प्रस्तुत",
                "under_review": "समीक्षा के तहत",
                "assigned": "आवंटित",
                "in_progress": "प्रगति पर",
                "pending_closure": "बंद होने का इंतजार",
                "resolved": "हल किया गया",
                "rejected": "अस्वीकृत",
                "escalated": "तेज किया गया",
                "reopened": "फिर से खोला गया",
                "spam": "स्पैम"
            }.get(duplicate.get("status", "active"), dup_status)

        await send_button_message(phone,
            strings["upvote_detected"].format(
                ticket_id=dup_ticket_id,
                distance=dup_distance,
                status=dup_status_lbl
            ),
            [
                {"id": "upvote_existing", "title": strings["upvote_btn"]},
                {"id": "force_submit", "title": strings["submit_anyway_btn"]},
            ]
        )
        return

    await send_text(phone, strings["submitting"])

    try:
        # Upload image to Supabase Storage
        filename  = f"{uuid.uuid4()}.jpg"
        image_bytes = session.get("image_bytes")
        photo_url = upload_image_to_supabase(image_bytes, filename) if image_bytes else None
        photo_urls = [photo_url] if photo_url else []
    except Exception:
        photo_urls = []

    # Use the authority already shown in the preview (computed during handle_location)
    routed_authority = preview["authority"]

    location_wkt  = f"POINT({lng} {lat})"
    address_text  = location.get("formatted_address", f"Lat {lat}, Lng {lng}")
    timestamp_str = datetime.now(timezone.utc).isoformat()

    # Automatic Profile Lookup (Zero-Login)
    citizen_id = await get_citizen_id(phone)

    try:
        response = supabase.table("complaints").insert({
            "citizen_id":          citizen_id,
            "category_id":         child_id,
            "title":               preview["title"],
            "description":         preview["description"],
            "severity":            preview["severity_db"],
            "effective_severity":  preview["severity_db"],
            "status":              "submitted",
            "location":            location_wkt,
            "ward_name":           location.get("locality") or "Unknown",
            "pincode":             location.get("pincode") or "000000",
            "digipin":             location.get("digipin") or "",
            "address_text":        address_text,
            "photo_urls":          photo_urls,
            "photo_count":         len(photo_urls),
            "assigned_department": routed_authority,
            "city":                location.get("city") or "Delhi",
            "upvote_count":        0,
            "is_spam":             False,
            "possible_duplicate":  bool(duplicate),
            "sla_breached":        False,
            "escalation_level":    0,
            "upvote_boost":        0,
        }).execute()
    except Exception as e:
        await send_text(phone, strings["submit_fail"].format(e=e))
        return

    if not response.data:
        await send_text(phone, strings["submission_failed"])
        return

    inserted  = response.data[0]
    ticket_id = inserted.get("ticket_id") or inserted.get("id", "PENDING")
    ticket_details_url = build_ticket_details_url(inserted.get("id"))

    log_event("whatsapp_ticket_created", level="INFO", reason_code="VALID_ISSUE", payload={"phone": phone, "ticket_id": ticket_id})

    await delete_session(phone)   # clear session

    councillor_name = location.get("councillor_name", "")
    councillor_party = location.get("councillor_party", "")
    councillor_str = f"{councillor_name} ({councillor_party})" if councillor_name else "Not Available"

    mla_name = location.get("mla_name", "")
    mla_party = location.get("mla_party", "")
    mla_str = f"{mla_name} ({mla_party})" if mla_name else "Not Available"

    success_body = strings["ticket_success"].format(
        ticket_id=ticket_id,
        authority=routed_authority,
        councillor=councillor_str,
        mla=mla_str,
        address=address_text[:80],
        url=ticket_details_url
    )
    await send_text(phone, success_body)

    # --- Background Email Notification ---
    asyncio.create_task(send_resend_email(
        ticket_id=ticket_id,
        complaint_id=inserted.get("id"),
        title=preview["title"],
        authority=routed_authority,
        severity=preview["severity_db"],
        ward=location.get("locality") or "Unknown",
        city=location.get("city") or "Delhi",
        address=address_text,
        citizen_id=citizen_id,
        worker_id=None,
        event_type="complaint_created",
        status="submitted",
    ))



# ═══════════════════════════════════════════════════════════════════════════════
# 6b. UPVOTE EXISTING DUPLICATE (WhatsApp duplicate parity)
# ═══════════════════════════════════════════════════════════════════════════════

async def upvote_duplicate(phone: str, session: dict):
    """Upvote an existing duplicate complaint instead of creating a new one."""
    duplicate = session.get("duplicate")
    
    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    if not duplicate or not duplicate.get("id"):
        no_dup_msg = "❌ No duplicate to upvote. Send *hi* to start again."
        if lang_code == "hi":
            no_dup_msg = "❌ समर्थन करने के लिए कोई समान शिकायत नहीं मिली। फिर से शुरू करने के लिए *hi* भेजें।"
        await send_text(phone, no_dup_msg)
        await delete_session(phone)
        return

    complaint_id = duplicate["id"]
    try:
        # Increment upvote count
        supabase.rpc("increment_upvote_count", {"complaint_id_input": complaint_id}).execute()
        ticket_id = duplicate.get("ticket_id", complaint_id)
        status = str(duplicate.get("status", "active")).replace("_", " ").title()

        status_clean = status
        if lang_code == "hi":
            status_clean = {
                "submitted": "प्रस्तुत",
                "under_review": "समीक्षा के तहत",
                "assigned": "आवंटित",
                "in_progress": "प्रगति पर",
                "pending_closure": "बंद होने का इंतजार",
                "resolved": "हल किया गया",
                "rejected": "अस्वीकृत",
                "escalated": "तेज किया गया",
                "reopened": "फिर से खोला गया",
                "spam": "स्पैम"
            }.get(duplicate.get("status", "active"), status)

        await delete_session(phone)  # clear session
        await send_text(phone, strings["upvoted_success"].format(ticket_id=ticket_id, status=status_clean))
    except Exception as e:
        print(f"[WhatsApp upvote error] {e}")
        # Fallback: try direct update if RPC not available
        try:
            current = supabase.table("complaints").select("upvote_count").eq("id", complaint_id).single().execute()
            current_count = (current.data or {}).get("upvote_count", 0)
            supabase.table("complaints").update({"upvote_count": current_count + 1}).eq("id", complaint_id).execute()
            await delete_session(phone)
            await send_text(phone, strings["upvoted_fallback"].format(ticket_id=duplicate.get('ticket_id', complaint_id)))
        except Exception as e2:
            print(f"[WhatsApp upvote fallback error] {e2}")
            await send_text(phone, strings["upvote_fail"])


# ═══════════════════════════════════════════════════════════════════════════════
# 7. STATUS CHECK
# ═══════════════════════════════════════════════════════════════════════════════

async def check_status(phone: str, ticket_id: Optional[str]):
    lang_code = await get_user_language(phone)
    strings = LOCALIZED_STRINGS.get(lang_code, LOCALIZED_STRINGS["en"])

    if not ticket_id:
        await send_text(phone, strings["status_provide_id"])
        return

    try:
        rows = supabase.table("complaints").select(
            "ticket_id, title, status, assigned_department, created_at"
        ).eq("ticket_id", ticket_id).limit(1).execute()
    except Exception as e:
        await send_text(phone, f"❌ Could not fetch status: {e}")
        return

    if not rows.data:
        await send_text(phone, strings["status_not_found"].format(ticket_id=ticket_id))
        return

    t = rows.data[0]
    status_raw = str(t.get('status', 'unknown'))
    status_clean = status_raw.replace('_', ' ').title()
    if lang_code == "hi":
        status_clean = {
            "submitted": "प्रस्तुत",
            "under_review": "समीक्षा के तहत",
            "assigned": "आवंटित",
            "in_progress": "प्रगति पर",
            "pending_closure": "बंद होने का इंतजार",
            "resolved": "हल किया गया",
            "rejected": "अस्वीकृत",
            "escalated": "तेज किया गया",
            "reopened": "फिर से खोला गया",
            "spam": "स्पैम"
        }.get(status_raw, status_clean)

    await send_text(phone,
        strings["status_title"].format(
            ticket_id=t.get('ticket_id'),
            title=t.get('title'),
            authority=t.get('assigned_department') or 'Pending',
            status=status_clean,
            date=str(t.get('created_at', ''))[:10]
        )
    )


# ═══════════════════════════════════════════════════════════════════════════════
# 8. GEMINI IMAGE CLASSIFICATION  (mirrors your /analyze endpoint logic)
# ═══════════════════════════════════════════════════════════════════════════════

async def classify_image_with_gemini(pil_image: Image.Image, user_text: str = "", language: str = "en") -> dict:
    from google.genai import types as genai_types

    child_list = "\n".join(
        f"{cid}: {cat['name']} (authority={cat['authority']})"
        for cid, cat in CHILD_CATEGORIES.items()
    )

    lang_name = LANGUAGE_NAMES.get(language, "English")
    lang_instruction = ""
    if lang_name != "English":
        lang_instruction = f"\n\nCRITICAL INSTRUCTION: You MUST translate and write the JSON 'title' and 'description' fields entirely in {lang_name}. Do NOT output them in English."

    # Base prompt (system instruction) without user text interpolation
    system_prompt = f"""You are a civic-issue classifier for an Indian city grievance system.

Analyse the image and respond ONLY with a valid JSON object — no markdown, no extra text.

=== SAFETY CHECK (do this FIRST) ===
- If the image contains explicit, adult, or sexually suggestive content → return {{"decision": "explicit_blocked", "reason": "Image contains explicit or adult content."}}
- If the image is primarily a person/selfie, private indoor scene, meme, screenshot, text-only, or has NO visible civic infrastructure issue → return {{"decision": "non_civic_rejected", "reason": "<brief reason>"}}
- A person appearing IN-FRAME is acceptable ONLY if a civic issue is clearly the main subject.

=== CLASSIFICATION (only if civic issue is visible) ===
Available issue categories (id: name):
{child_list}

Return exactly:
{{
  "decision": "valid_issue",
  "child_id": <integer from the list above>,
  "title": "<short 8-word title>",
  "description": "<2-3 sentence description>",
  "severity": "<Low|Medium|High|Critical>",
  "confidence": <0.0-1.0>
}}
{lang_instruction}
"""

    import io
    buf = io.BytesIO()
    pil_image.save(buf, format="JPEG", quality=85)
    image_bytes = buf.getvalue()

    # Create config with system_instruction and temperature 0 to align with standard classification configs
    config = genai_types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.0
    )

    # Separate untrusted user description into a distinct content part
    contents = [
        genai_types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
    ]
    if user_text:
        contents.append(f"User description to aid classification: {user_text}")

    for model in [GEMINI_PRIMARY_MODEL, GEMINI_FALLBACK_MODEL]:
        try:
            response = gemini_client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
            raw = response.text.strip()
            # strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]
            result = json.loads(raw)
            break
        except Exception as e:
            print(f"[Gemini {model}] error: {e}")
            result = None

    if not result:
        raise ValueError("Gemini could not classify the image.")

    # Handle safety decisions
    decision = result.get("decision", "valid_issue")

    if decision == "explicit_blocked":
        return {
            "decision": "explicit_blocked",
            "decision_reason": result.get("reason", "Image contains explicit or inappropriate content."),
        }

    if decision == "non_civic_rejected":
        return {
            "decision": "non_civic_rejected",
            "decision_reason": result.get("reason", "Image does not show a civic issue."),
        }

    child_id = int(result["child_id"])
    if child_id not in CHILD_CATEGORIES:
        child_id = 16   # default: Garbage Collection

    category     = CHILD_CATEGORIES[child_id]
    severity_lbl = result.get("severity", "Medium")
    severity_db  = {"Low": "L1", "Medium": "L2", "High": "L3", "Critical": "L4"}.get(severity_lbl, "L2")

    return {
        "decision": "valid_issue",
        "child_id":    child_id,
        "issue_name":  category["name"],
        "authority":   category["authority"],
        "parent_id":   category["parent"],
        "title":       result.get("title", category["name"]),
        "description": result.get("description", ""),
        "severity":    severity_lbl,
        "severity_db": severity_db,
        "confidence":  float(result.get("confidence", 0.8)),
    }


# ═══════════════════════════════════════════════════════════════════════════════
# 9. SEND A TEXT MESSAGE VIA WHATSAPP API
# ═══════════════════════════════════════════════════════════════════════════════

async def send_text(phone: str, text: str):
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "text",
        "text": {"body": text},
    }
    headers = {
        "Authorization": f"Bearer {get_whatsapp_token()}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(get_graph_api_url(), json=payload, headers=headers)
            if resp.status_code != 200:
                print(f"[send_text error] {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[send_text exception] {e}")


async def send_location_request(phone: str, text: str):
    """
    Sends a native 'location_request_message' that triggers the mobile location picker.
    """
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "location_request_message",
            "body": {
                "text": text
            },
            "action": {
                "name": "send_location"
            }
        }
    }
    headers = {
        "Authorization": f"Bearer {get_whatsapp_token()}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(get_graph_api_url(), json=payload, headers=headers)
            if resp.status_code != 200:
                print(f"[send_location_request error] {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[send_location_request exception] {e}")


async def send_button_message(phone: str, body_text: str, buttons: list):
    """
    Sends an interactive message with up to 3 reply buttons.
    Each button in the list should be a dict: {"id": "unique_id", "title": "Button Title"}
    """
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": body_text
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {
                            "id": b["id"],
                            "title": b["title"]
                        }
                    } for b in buttons
                ]
            }
        }
    }
    headers = {
        "Authorization": f"Bearer {get_whatsapp_token()}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(get_graph_api_url(), json=payload, headers=headers)
            if resp.status_code != 200:
                print(f"[send_button_message error] {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[send_button_message exception] {e}")


async def send_list_message(phone: str, body_text: str, button_text: str, sections: list):
    """
    Sends an interactive message of type 'list'.
    Sections should be formatted according to WhatsApp Cloud API structure.
    """
    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": phone,
        "type": "interactive",
        "interactive": {
            "type": "list",
            "body": {
                "text": body_text
            },
            "action": {
                "button": button_text,
                "sections": sections
            }
        }
    }
    headers = {
        "Authorization": f"Bearer {get_whatsapp_token()}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(get_graph_api_url(), json=payload, headers=headers)
            if resp.status_code != 200:
                print(f"[send_list_message error] {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"[send_list_message exception] {e}")


# (Duplicate definition removed)


# ═══════════════════════════════════════════════════════════════════════════════
# 10. DOWNLOAD MEDIA FROM META
# ═══════════════════════════════════════════════════════════════════════════════

async def download_whatsapp_media(media_id: str) -> bytes:
    headers = {"Authorization": f"Bearer {get_whatsapp_token()}"}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Step 1: get download URL
            meta_resp = await client.get(
                f"https://graph.facebook.com/v22.0/{media_id}",
                headers=headers,
            )
            meta_resp.raise_for_status()
            media_url = meta_resp.json()["url"]

            # Step 2: download the actual bytes
            file_resp = await client.get(media_url, headers=headers)
            file_resp.raise_for_status()
            return file_resp.content
    except Exception as e:
        print(f"[download_whatsapp_media exception] {e}")
        raise