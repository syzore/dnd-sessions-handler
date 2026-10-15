---
id: a
background: mystic
---

## choice: subclass
title: איזה נתיב?
context: element

### נתיב א
id: path_one
term: sc_path

### נתיב ב
id: path_two

## choice: background
from: session-one

## info: lore
from: session-one

## choice: mystic_tools
when: background = mystic
multi: true
count: 2
prompt: בחר/י שני כלים

### 🔧 מפתח
id: wrench

### 🔨 פטיש
id: hammer

### 🪚 מסור
id: saw

## choice: mystic_langs
when: background = mystic
multi: true
count: 2
prompt: בחר/י שתי שפות

### 🗣️ אחת
id: one

### 💬 שתיים
id: two

## choice: mystic_path
when: background = mystic
prompt: איזה נתיב?

### 🌙 ירח
id: moon

### ☀️ שמש
id: sun

## text: mystic_story
when: background = mystic
prompt: ספר/י

## choice: trait
random: true
prompt: מה התכונה שלך?

### 🧘 רגוע
id: calm

### 📚 ספרותי
id: bookish
when: background = sage

### ✒️ מוכתם
id: inked
when: background = scribe

### 🐗 פראי
id: wild
