"""Where the audience lives -> which clocks they read.

Uses Zernio follower demographics (country, city) to estimate what share of
the audience is in each UTC offset, so best times can be shown in the
audience's local time and a timezone mismatch can be flagged.

Countries spanning several zones use their most populous zone and are marked
approximate. This is an estimate from where followers live; it is not a
measure of when they are online (Instagram no longer exposes that).
"""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

COUNTRY_TZ = {
    "KW": "Asia/Kuwait", "SA": "Asia/Riyadh", "AE": "Asia/Dubai", "QA": "Asia/Qatar", "BH": "Asia/Bahrain",
    "OM": "Asia/Muscat", "IQ": "Asia/Baghdad", "JO": "Asia/Amman", "LB": "Asia/Beirut", "SY": "Asia/Damascus",
    "EG": "Africa/Cairo", "MA": "Africa/Casablanca", "DZ": "Africa/Algiers", "TN": "Africa/Tunis", "LY": "Africa/Tripoli",
    "SD": "Africa/Khartoum", "YE": "Asia/Aden", "PS": "Asia/Gaza", "TR": "Europe/Istanbul", "IR": "Asia/Tehran",
    "PK": "Asia/Karachi", "IN": "Asia/Kolkata", "BD": "Asia/Dhaka", "PH": "Asia/Manila", "MY": "Asia/Kuala_Lumpur",
    "SG": "Asia/Singapore", "GB": "Europe/London", "IE": "Europe/Dublin", "FR": "Europe/Paris", "DE": "Europe/Berlin",
    "NL": "Europe/Amsterdam", "IT": "Europe/Rome", "ES": "Europe/Madrid", "SE": "Europe/Stockholm", "CH": "Europe/Zurich",
    "NG": "Africa/Lagos", "KE": "Africa/Nairobi", "ZA": "Africa/Johannesburg", "JP": "Asia/Tokyo", "KR": "Asia/Seoul",
    "CN": "Asia/Shanghai", "NZ": "Pacific/Auckland",
    # multi-zone countries: most populous zone (approximate)
    "US": "America/New_York", "CA": "America/Toronto", "BR": "America/Sao_Paulo", "MX": "America/Mexico_City",
    "AU": "Australia/Sydney", "RU": "Europe/Moscow", "ID": "Asia/Jakarta",
}
APPROX = {"US", "CA", "BR", "MX", "AU", "RU", "ID"}


def _offset(tz: str, when: datetime | None = None) -> float:
    return (when or datetime.now(ZoneInfo(tz))).astimezone(ZoneInfo(tz)).utcoffset().total_seconds() / 3600


def zones(countries: list[dict], account_tz: str) -> dict:
    """countries: [{name: 'KW', value: 320}, ...] -> audience share by UTC offset."""
    total = sum(c["value"] for c in countries) or 0
    if not total:
        return {"zones": [], "note": "No audience location data yet (needs 100+ followers and the Analytics add-on)."}
    by = {}
    unknown = 0
    for c in countries:
        code = str(c["name"]).upper()
        tz = COUNTRY_TZ.get(code)
        if not tz:
            unknown += c["value"]
            continue
        off = _offset(tz)
        z = by.setdefault(off, {"offset": off, "tz": tz, "share": 0.0, "countries": [], "approx": False})
        z["share"] += c["value"] / total
        z["countries"].append(code)
        z["approx"] = z["approx"] or code in APPROX
    out = sorted(by.values(), key=lambda z: -z["share"])
    for z in out:
        z["share"] = round(z["share"], 3)
    acc_off = _offset(account_tz)
    main = out[0] if out else None
    res = {
        "zones": out,
        "unknown": round(unknown / total, 3),
        "account_offset": acc_off,
        "main_offset": main["offset"] if main else None,
        "mismatch": bool(main and main["offset"] != acc_off and main["share"] >= 0.5),
        "same_clock_share": round(sum(z["share"] for z in out if z["offset"] == acc_off), 3),
    }
    if res["mismatch"]:
        res["note"] = (f"Most of your audience ({round(main['share'] * 100)}%) is on UTC{main['offset']:+g}, "
                       f"but your timezone is UTC{acc_off:+g}. Times are shown in both.")
    return res
