#!/usr/bin/env python3
"""Bargain Drop: re-categorize ALL active Shopify products to canonical top-level.

FAST path (this version):
  1. bulk READ (bulkOperationRunQuery) all products once.
  2. Resolve top-level locally (product_type split + title keywords), CJ only for unknowns.
  3. Write back EVERYTHING in ONE bulkOperationRunMutation with productUpdate - not rate limited.
"""
import os, sys, json, time, re, uuid
import urllib.request, urllib.error, urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed

DOMAIN  = os.environ['SHOPIFY_STORE_DOMAIN']
TOKEN   = os.environ['SHOPIFY_ACCESS_TOKEN']
API     = "https://" + DOMAIN + "/admin/api/2025-10"
CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1'

CJ_KEYS = [k.strip() for k in os.environ.get('CJ_KEYS', '').split(',') if k.strip()]
CJ_KEYS = list(dict.fromkeys(CJ_KEYS))
if not CJ_KEYS:
    CJ_KEYS = [
        'CJ5800059@api@f063a5b2bae64d659849301491d753d8',
        'CJ5798986@api@8e86ba7f88de4781812950784cbc2dc4',
        'CJ5799030@api@c764039900e64ebbbdc3b9398a26bb2c',
        'CJ5820279@api@e3b050af15cc44b590ac9b0d1f813ef',
    ]

TOP_LEVELS = [
    ('womens-clothing',   "Women's Clothing"),
    ('mens-clothing',     "Men's Clothing"),
    ('bags-shoes',        "Bags & Shoes"),
    ('jewelry-watches',   "Jewelry & Watches"),
    ('home-garden-furniture', "Home, Garden & Furniture"),
    ('home-improvement',  "Home Improvement"),
    ('health-beauty-hair', "Health, Beauty & Hair"),
    ('sports-outdoors',   "Sports & Outdoors"),
    ('toys-kids-babies',  "Toys, Kids & Babies"),
    ('phones-accessories', "Phones & Accessories"),
    ('consumer-electronics', "Consumer Electronics"),
    ('automobiles-motorcycles', "Automobiles & Motorcycles"),
    ('pet-supplies',      "Pet Supplies"),
    ('computer-office',   "Computer & Office"),
]
DISPLAY = {s: n for s, n in TOP_LEVELS}
