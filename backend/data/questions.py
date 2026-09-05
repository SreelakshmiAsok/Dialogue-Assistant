# ============================================================
# QUESTION BANK — 25 Questions per Character (100 Total)
# Designed for autistic children's social skills training
# ============================================================

import json
import os

LESSONS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "lessons")


def _json_lesson_path(question_id):
    """Map father_02 -> lessons/tier1/father/lesson_2.json when present."""
    if not question_id or "_" not in question_id:
        return None
    character, _, rest = question_id.partition("_")
    try:
        num = int(rest)
    except ValueError:
        return None
    path = os.path.normpath(
        os.path.join(LESSONS_DIR, "tier1", character.lower(), f"lesson_{num}.json")
    )
    if os.path.isfile(path):
        return path
    return None


def _merge_json_lesson(question):
    """JSON lesson files are the source of truth when they exist."""
    path = _json_lesson_path(question.get("id", ""))
    if not path:
        return question
    try:
        with open(path, encoding="utf-8") as handle:
            data = json.load(handle)
        if not isinstance(data, dict):
            return question
        merged = dict(question)
        merged.update(data)
        return merged
    except (OSError, json.JSONDecodeError):
        return question


QUESTIONS = {

    # ========================================================
    # FATHER (25 Questions)
    # ========================================================

    "Father": [
        {
            "id": "father_01",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Shopping",
            "social_story": "You are at home. Appa wants to go to the shop. He asks you to come with him.",
            "question_tanglish": "En kooda kadaiki variya?",
            "question_tamil": "என் கூட கடைக்கி வரியா?",
            "expected_answers": [
                "Varen appa", "Varan appa", "Varaen appa", "Varraen appa",
                "Seri appa", "Aama appa", "Ok appa", "Varengo appa"
            ],
            "model_answer": "Varen appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_02",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Meals",
            "social_story": "It is lunchtime. Appa asks if you have eaten your food.",
            "question_tanglish": "Saaptiya?",
            "question_tamil": "சாப்பிட்டியா?",
            "required_communication": {
                "intent": "AnswerQuestion",
                "meaning": "Indicate whether they have eaten."
            },
            "preferred_phrases": [
                "Saaptaen appa",
                "Aama appa"
            ],
            "model_answer": "Saaptaen appa",
            "difficulty": 1
        },
        {
            "id": "father_03",
            "character": "Father",
            "avatar": "👨",
            "lesson": "TV",
            "social_story": "You are watching TV. Appa asks you to turn off the TV because it is study time.",
            "question_tanglish": "TV off pannuva?",
            "question_tamil": "TV ஆஃப் பண்ணுவா?",
            "expected_answers": [
                "Seri appa", "Aama appa", "Ok appa",
                "Pannuren appa", "Panren appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_04",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Books",
            "social_story": "Appa is sitting in the hall. He asks you to bring his book from the table.",
            "question_tanglish": "Book eduthu kudu.",
            "question_tamil": "புக் எடுத்துக் குடு.",
            "expected_answers": [
                "Idho appa", "Seri appa", "Kudukuren appa",
                "Eduthukuren appa", "Aama appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_05",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Homework",
            "social_story": "You come home from school. Appa asks if you finished your homework.",
            "question_tanglish": "Homework mudichacha?",
            "question_tamil": "ஹோம்வொர்க் முடிச்சாச்சா?",
            "expected_answers": [
                "Aama appa", "Mudichiten appa", "Mudichitten appa",
                "Mudichutten appa", "Seri appa", "Illa appa",
                "Pannuren appa", "Illai appa"
            ],
            "model_answer": "Mudichiten appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_06",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Water",
            "social_story": "Appa is thirsty. He asks you to bring a glass of water.",
            "question_tanglish": "Thanni kondu va.",
            "question_tamil": "தண்ணி கொண்டு வா.",
            "expected_answers": [
                "Seri appa", "Idho appa", "Konduvaren appa",
                "Aama appa", "Konduraren appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_07",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Punctuality",
            "social_story": "It is morning. You are getting ready for school. Appa tells you not to be late.",
            "question_tanglish": "Late aagidathe.",
            "question_tamil": "லேட் ஆகிடாதே.",
            "expected_answers": [
                "Seri appa", "Aama appa", "Ok appa",
                "Aagamaaten appa", "Ready appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_08",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Phone",
            "social_story": "You are playing with Appa's phone. He asks you to give it back.",
            "question_tanglish": "Phone kudu.",
            "question_tamil": "போன் குடு.",
            "expected_answers": [
                "Idho appa", "Seri appa", "Kudukuren appa",
                "Aama appa"
            ],
            "model_answer": "Idho appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_09",
            "character": "Father",
            "avatar": "👨",
            "lesson": "School",
            "social_story": "You come back from school. Appa asks how your day at school was.",
            "question_tanglish": "School epdi irundhudhu?",
            "question_tamil": "ஸ்கூல் எப்படி இருந்துச்சு?",
            "expected_answers": [
                "Nalla irundhudhu appa", "Nallaa irundhudhu appa",
                "Nalla irundhuchu appa", "Super appa",
                "Romba nalla irundhuchu appa", "Ok irundhudhu appa"
            ],
            "model_answer": "Nalla irundhudhu appa",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "father_10",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Outing",
            "social_story": "It is a weekend. Appa asks if you want to go outside for a walk.",
            "question_tanglish": "Veliya polaama?",
            "question_tamil": "வெளியே போலாமா?",
            "expected_answers": [
                "Polaam appa", "Polaama appa", "Seri appa",
                "Aama appa", "Vanga appa", "Polaam"
            ],
            "model_answer": "Polaam appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_11",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Sleep",
            "social_story": "It is bedtime. Appa tells you to go to sleep.",
            "question_tanglish": "Poi thoongu.",
            "question_tamil": "போய் தூங்கு.",
            "expected_answers": [
                "Seri appa", "Aama appa", "Ok appa",
                "Good night appa", "Thoonguran appa"
            ],
            "model_answer": "Seri appa, good night",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_12",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Cleaning",
            "social_story": "Your room is messy. Appa asks you to clean your room.",
            "question_tanglish": "Room clean pannu.",
            "question_tamil": "ரூம் க்ளீன் பண்ணு.",
            "expected_answers": [
                "Seri appa", "Aama appa", "Pannuren appa",
                "Ok appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_13",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Guests",
            "social_story": "Guests are coming to your house. Appa asks you to behave nicely.",
            "question_tanglish": "Nalla nadandhukkanum, puriyudha?",
            "question_tamil": "நல்லா நடந்துக்கணும், புரியுதா?",
            "expected_answers": [
                "Seri appa", "Aama appa", "Puriyudhu appa",
                "Ok appa", "Nalla nadandhukuren appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "father_14",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Medicine",
            "social_story": "You are feeling sick. Appa gives you medicine and asks you to take it.",
            "question_tanglish": "Marundhu saapdu.",
            "question_tamil": "மருந்து சாப்பிடு.",
            "expected_answers": [
                "Seri appa", "Aama appa", "Saapiduren appa",
                "Ok appa", "Saaptuten appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_15",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Breakfast",
            "social_story": "It is morning. Appa calls you to eat breakfast.",
            "question_tanglish": "Va saapdu, breakfast ready.",
            "question_tamil": "வா சாப்பிடு, ப்ரேக்ஃபாஸ்ட் ரெடி.",
            "expected_answers": [
                "Varen appa", "Seri appa", "Aama appa",
                "Ok appa", "Varengo appa"
            ],
            "model_answer": "Varen appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_16",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Studies",
            "social_story": "Exam is coming next week. Appa asks if you are studying well.",
            "question_tanglish": "Nalla padikkuriya?",
            "question_tamil": "நல்லா படிக்குறியா?",
            "expected_answers": [
                "Aama appa", "Padikkuren appa", "Nalla padikkuren appa",
                "Seri appa"
            ],
            "model_answer": "Aama appa, padikkuren",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "father_17",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Temple",
            "social_story": "It is Friday. Appa asks if you want to come to the temple.",
            "question_tanglish": "Kovilukku variya?",
            "question_tamil": "கோவிலுக்கு வரியா?",
            "expected_answers": [
                "Varen appa", "Seri appa", "Aama appa",
                "Polaam appa"
            ],
            "model_answer": "Varen appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_18",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Dress",
            "social_story": "You are going to a family function. Appa asks you to wear nice clothes.",
            "question_tanglish": "Nalla dress podu.",
            "question_tamil": "நல்ல ட்ரெஸ் போடு.",
            "expected_answers": [
                "Seri appa", "Aama appa", "Ok appa",
                "Poduren appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_19",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Permission",
            "social_story": "You want to go to your friend's house. Appa asks where you are going.",
            "question_tanglish": "Enga poreh?",
            "question_tamil": "எங்க போறே?",
            "expected_answers": [
                "Friend veetukku appa", "Friend house appa",
                "Pakkathula appa", "Veliya appa",
                "Nanban veetukku appa"
            ],
            "model_answer": "Friend veetukku appa",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "father_20",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Milk",
            "social_story": "Appa gives you a glass of milk in the morning.",
            "question_tanglish": "Paal kudicha?",
            "question_tamil": "பால் குடிச்சா?",
            "expected_answers": [
                "Kudichen appa", "Kudichiten appa", "Aama appa",
                "Illa appa", "Kudikuren appa"
            ],
            "model_answer": "Kudichen appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_21",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Shoes",
            "social_story": "You are going out. Appa asks you to wear your shoes.",
            "question_tanglish": "Shoes podu.",
            "question_tamil": "ஷூஸ் போடு.",
            "expected_answers": [
                "Seri appa", "Aama appa", "Ok appa",
                "Poduren appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_22",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Manners",
            "social_story": "You ate dinner. Appa asks if you liked the food.",
            "question_tanglish": "Saapadu epdi irundhuchu?",
            "question_tamil": "சாப்பாடு எப்படி இருந்துச்சு?",
            "expected_answers": [
                "Nalla irundhudhu appa", "Super appa", "Romba nalla appa",
                "Nallaa irundhudhu appa", "Tasty appa"
            ],
            "model_answer": "Nalla irundhudhu appa",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "father_23",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Helping",
            "social_story": "Appa is carrying heavy bags. He asks you to help.",
            "question_tanglish": "Konjam help pannu.",
            "question_tamil": "கொஞ்சம் ஹெல்ப் பண்ணு.",
            "expected_answers": [
                "Seri appa", "Varen appa", "Aama appa",
                "Pannuren appa"
            ],
            "model_answer": "Seri appa, varen",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_24",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Morning",
            "social_story": "It is early morning. Appa wakes you up for school.",
            "question_tanglish": "Ezhundhu, school time achu.",
            "question_tamil": "எழுந்து, ஸ்கூல் டைம் ஆச்சு.",
            "expected_answers": [
                "Seri appa", "Aama appa", "Ezhundhuten appa",
                "Ok appa", "Varen appa"
            ],
            "model_answer": "Seri appa",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "father_25",
            "character": "Father",
            "avatar": "👨",
            "lesson": "Thanks",
            "social_story": "Appa bought you a new book as a gift.",
            "question_tanglish": "Pudhu book vangichu irukken, pudikkuma?",
            "question_tamil": "புது புக் வாங்கிச்சு இருக்கேன், புடிக்குமா?",
            "expected_answers": [
                "Thank you appa", "Thanks appa", "Romba nandri appa",
                "Pudikkum appa", "Super appa", "Romba pudikkum appa"
            ],
            "model_answer": "Thank you appa",
            "respect_required": True,
            "difficulty": 2
        },
    ],

    # ========================================================
    # TEACHER (25 Questions)
    # ========================================================

    "Teacher": [
        {
            "id": "teacher_01",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Greeting",
            "social_story": "You walk into the classroom in the morning. Teacher greets you.",
            "question_tanglish": "Good morning! Ulla vaanga.",
            "question_tamil": "குட் மார்னிங்! உள்ள வாங்க.",
            "expected_answers": [
                "Good morning teacher", "Good morning miss",
                "Good morning sir", "Good morning ma'am",
                "Vanakkam teacher", "Vanakkam miss"
            ],
            "model_answer": "Good morning teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_02",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Homework",
            "social_story": "Teacher is checking homework. She asks if you finished it.",
            "question_tanglish": "Homework mudichacha?",
            "question_tamil": "ஹோம்வொர்க் முடிச்சாச்சா?",
            "expected_answers": [
                "Aama teacher", "Ama teacher", "Aama ma'am",
                "Mudichiten teacher", "Mudichitten teacher",
                "Mudichutten teacher", "Mudichiten ma'am",
                "Seri teacher", "Aama sir", "Yes teacher", "Yes ma'am"
            ],
            "model_answer": "Aama teacher, mudichiten",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_03",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Notebook",
            "social_story": "Teacher asks you to give your notebook for correction.",
            "question_tanglish": "Notebook kudunga.",
            "question_tamil": "நோட்புக் குடுங்க.",
            "expected_answers": [
                "Idho teacher", "Idho miss", "Idho ma'am",
                "Seri teacher", "Kudukuren teacher"
            ],
            "model_answer": "Idho teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_04",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Understanding",
            "social_story": "Teacher just explained a math problem. She asks if you understood.",
            "question_tanglish": "Question purinjutha?",
            "question_tamil": "கேள்வி புரிஞ்சுதா?",
            "expected_answers": [
                "Purinjuthu teacher", "Purinjudhu teacher",
                "Aama teacher", "Puriyala teacher",
                "Innum oru thara sollunga teacher",
                "Purinjuchu teacher"
            ],
            "model_answer": "Purinjuthu teacher",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "teacher_05",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Class Start",
            "social_story": "It is the start of a new period. Teacher asks if everyone is ready.",
            "question_tanglish": "Class aarambikkalaama?",
            "question_tamil": "கிளாஸ் ஆரம்பிக்கலாமா?",
            "expected_answers": [
                "Ready teacher", "Aama teacher", "Seri teacher",
                "Ready miss", "Yes teacher"
            ],
            "model_answer": "Ready teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_06",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Book",
            "social_story": "Teacher asks everyone to open their textbook to page 10.",
            "question_tanglish": "Book open pannunga.",
            "question_tamil": "புக் ஓபன் பண்ணுங்க.",
            "expected_answers": [
                "Seri teacher", "Aama teacher", "Ok teacher",
                "Seri miss", "Seri ma'am"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_07",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Attention",
            "social_story": "Teacher is writing on the board. She asks everyone to look at the board.",
            "question_tanglish": "Board paarunga.",
            "question_tamil": "போர்ட் பாருங்க.",
            "expected_answers": [
                "Seri teacher", "Paakuren teacher", "Aama teacher",
                "Ok teacher"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_08",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Assignment",
            "social_story": "Teacher asks if you completed the class assignment.",
            "question_tanglish": "Assignment complete pannittiya?",
            "question_tamil": "அசைன்மென்ட் கம்ப்ளீட் பண்ணிட்டியா?",
            "expected_answers": [
                "Panniten teacher", "Pannitten teacher",
                "Aama teacher", "Complete teacher",
                "Yes teacher", "Mudichiten teacher"
            ],
            "model_answer": "Panniten teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_09",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Reading",
            "social_story": "It is reading time. Teacher asks you to read aloud.",
            "question_tanglish": "Read pannunga.",
            "question_tamil": "ரீட் பண்ணுங்க.",
            "expected_answers": [
                "Seri teacher", "Padikuren teacher", "Aama teacher",
                "Ok teacher"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_10",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Sit Down",
            "social_story": "You were standing. Teacher asks you to sit down.",
            "question_tanglish": "Ukkaarunga.",
            "question_tamil": "உக்காருங்க.",
            "expected_answers": [
                "Seri teacher", "Aama teacher", "Ok teacher",
                "Ukkaaren teacher"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_11",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Attendance",
            "social_story": "Teacher is taking attendance. She calls your name.",
            "question_tanglish": "Present ah?",
            "question_tamil": "ப்ரசண்ட் ஆ?",
            "expected_answers": [
                "Present teacher", "Present miss", "Present ma'am",
                "Yes teacher", "Irukken teacher"
            ],
            "model_answer": "Present teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_12",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Permission",
            "social_story": "You need to go to the bathroom. Teacher asks what you need.",
            "question_tanglish": "Enna venum?",
            "question_tamil": "என்ன வேணும்?",
            "expected_answers": [
                "Bathroom ponum teacher", "Bathroom polama teacher",
                "Washroom teacher", "May I go teacher",
                "Permission teacher"
            ],
            "model_answer": "Bathroom ponum teacher",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "teacher_13",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Answer",
            "social_story": "Teacher asks a question in class. She asks if you know the answer.",
            "question_tanglish": "Ivukku answer theriyuma?",
            "question_tamil": "இதுக்கு ஆன்சர் தெரியுமா?",
            "expected_answers": [
                "Theriyum teacher", "Theriyum miss",
                "Theriyadhu teacher", "Theriyadhu miss",
                "Aama teacher", "Yes teacher"
            ],
            "model_answer": "Theriyum teacher",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "teacher_14",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Write",
            "social_story": "Teacher dictates notes. She asks you to write them down.",
            "question_tanglish": "Ezhudhunga.",
            "question_tamil": "எழுதுங்க.",
            "expected_answers": [
                "Seri teacher", "Ezhuthuren teacher",
                "Aama teacher", "Ok teacher"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_15",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Quiet",
            "social_story": "The class is noisy. Teacher asks everyone to be quiet.",
            "question_tanglish": "Silence please.",
            "question_tamil": "சைலன்ஸ் ப்ளீஸ்.",
            "expected_answers": [
                "Seri teacher", "Sorry teacher", "Ok teacher",
                "Aama teacher"
            ],
            "model_answer": "Sorry teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_16",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Line Up",
            "social_story": "It is assembly time. Teacher asks everyone to stand in line.",
            "question_tanglish": "Line la nikkuonga.",
            "question_tamil": "லைன்ல நிக்கோங்க.",
            "expected_answers": [
                "Seri teacher", "Aama teacher", "Ok teacher",
                "Nikkuren teacher"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_17",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Project",
            "social_story": "Teacher asks about your science project progress.",
            "question_tanglish": "Project epdi varudhu?",
            "question_tamil": "ப்ராஜெக்ட் எப்படி வருது?",
            "expected_answers": [
                "Nalla varudhu teacher", "Pannikkitu irukken teacher",
                "Almost ready teacher", "Mudiyum teacher",
                "Konjam help venum teacher"
            ],
            "model_answer": "Nalla varudhu teacher",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "teacher_18",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Exam",
            "social_story": "Exam is next week. Teacher asks if you are preparing well.",
            "question_tanglish": "Exam ku prepare panriya?",
            "question_tamil": "எக்ஸாம் க்கு ப்ரிபேர் பண்றியா?",
            "expected_answers": [
                "Aama teacher", "Pannuren teacher",
                "Padikkuren teacher", "Yes teacher",
                "Prepare pannuren teacher"
            ],
            "model_answer": "Aama teacher, padikkuren",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "teacher_19",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Thank You",
            "social_story": "Teacher helped you solve a difficult math problem.",
            "question_tanglish": "Ippo purinjutha?",
            "question_tamil": "இப்போ புரிஞ்சுதா?",
            "expected_answers": [
                "Purinjuthu teacher thank you", "Purinjuchu teacher",
                "Aama teacher nandri", "Thank you teacher",
                "Purinjuthu teacher"
            ],
            "model_answer": "Purinjuthu teacher, thank you",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "teacher_20",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Sharing",
            "social_story": "Your friend forgot their pencil. Teacher asks you to share yours.",
            "question_tanglish": "Pencil share pannunga.",
            "question_tamil": "பென்சில் ஷேர் பண்ணுங்க.",
            "expected_answers": [
                "Seri teacher", "Aama teacher", "Ok teacher",
                "Kudukuren teacher"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_21",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Apology",
            "social_story": "You accidentally pushed your friend. Teacher asks you to say sorry.",
            "question_tanglish": "Sorry sollu.",
            "question_tamil": "ஸாரி சொல்லு.",
            "expected_answers": [
                "Sorry teacher", "Seri teacher", "Sorry solluven teacher",
                "Aama teacher"
            ],
            "model_answer": "Sorry teacher, I will say sorry",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "teacher_22",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Cleaning",
            "social_story": "The classroom is messy. Teacher asks everyone to clean up.",
            "question_tanglish": "Class clean pannunga.",
            "question_tamil": "கிளாஸ் க்ளீன் பண்ணுங்க.",
            "expected_answers": [
                "Seri teacher", "Aama teacher", "Pannuren teacher",
                "Ok teacher"
            ],
            "model_answer": "Seri teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_23",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Sports",
            "social_story": "It is sports period. Teacher asks if you want to play.",
            "question_tanglish": "Sports period, aadalaama?",
            "question_tamil": "ஸ்போர்ட்ஸ் பீரியட், ஆடலாமா?",
            "expected_answers": [
                "Aama teacher", "Aadalaam teacher", "Seri teacher",
                "Yes teacher", "Ready teacher"
            ],
            "model_answer": "Aama teacher",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_24",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Goodbye",
            "social_story": "School is over. Teacher says goodbye to the class.",
            "question_tanglish": "Bye children, naalaikku paappom.",
            "question_tamil": "பை சில்ட்ரன், நாளைக்கு பாப்போம்.",
            "expected_answers": [
                "Bye teacher", "Good bye teacher", "Bye miss",
                "Thank you teacher bye", "Naalaikku paappom teacher",
                "Vanakkam teacher"
            ],
            "model_answer": "Bye teacher, thank you",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "teacher_25",
            "character": "Teacher",
            "avatar": "👩‍🏫",
            "lesson": "Doubt",
            "social_story": "You have a doubt about the lesson. Teacher asks what your doubt is.",
            "question_tanglish": "Enna doubt?",
            "question_tamil": "என்ன டவுட்?",
            "expected_answers": [
                "Indha question puriyala teacher",
                "Idhu puriyala teacher",
                "Innum oru thara sollunga teacher",
                "Doubt irukku teacher",
                "Please explain teacher"
            ],
            "model_answer": "Indha question puriyala teacher",
            "respect_required": True,
            "difficulty": 3
        },
    ],

    # ========================================================
    # FRIEND (25 Questions)
    # ========================================================

    "Friend": [
        {
            "id": "friend_01",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Cricket",
            "social_story": "You are in the playground. Your friend asks you to play cricket.",
            "question_tanglish": "Cricket vilayaadalaama?",
            "question_tamil": "கிரிக்கெட் விளையாடலாமா?",
            "expected_answers": [
                "Va da", "Vaa da", "Seri da", "Sari da",
                "Aama da", "Ama da", "Okay da", "Ok da",
                "Vilayaadalaam", "Va machi", "Polaam da"
            ],
            "model_answer": "Va da, vilayaadalaam",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_02",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Movie",
            "social_story": "It is a holiday. Your friend asks if you want to watch a movie.",
            "question_tanglish": "Movie paakalaama?",
            "question_tamil": "மூவி பாக்கலாமா?",
            "expected_answers": [
                "Polaam da", "Paakalaama da", "Seri da",
                "Va da", "Ok da", "Aama da",
                "Paakkalaam", "Polaam machi"
            ],
            "model_answer": "Polaam da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_03",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Food",
            "social_story": "It is break time at school. Your friend asks if you want to eat together.",
            "question_tanglish": "Saapdalama?",
            "question_tamil": "சாப்பிடலாமா?",
            "expected_answers": [
                "Sapdalaam", "Saapdalaam da", "Va da",
                "Seri da", "Polaam da", "Aama da"
            ],
            "model_answer": "Sapdalaam da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_04",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Games",
            "social_story": "Your friend has a new mobile game. They ask if you want to play.",
            "question_tanglish": "Game aadalaama?",
            "question_tamil": "கேம் ஆடலாமா?",
            "expected_answers": [
                "Va da", "Aadalaama", "Seri da",
                "Aama da", "Ok da", "Va machi"
            ],
            "model_answer": "Va da, aadalaam",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_05",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Cycle",
            "social_story": "It is evening. Your friend asks if you want to go cycling.",
            "question_tanglish": "Cycle ottalaama?",
            "question_tamil": "சைக்கிள் ஓட்டலாமா?",
            "expected_answers": [
                "Polaam da", "Va da", "Seri da",
                "Ottalaama", "Aama da", "Ok da"
            ],
            "model_answer": "Polaam da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_06",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Beach",
            "social_story": "It is a sunny day. Your friend wants to go to the beach.",
            "question_tanglish": "Beach polaama?",
            "question_tamil": "பீச் போலாமா?",
            "expected_answers": [
                "Polaam da", "Va da", "Seri da",
                "Aama da", "Let's go da"
            ],
            "model_answer": "Polaam da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_07",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Football",
            "social_story": "Your friend has a football. They ask if you want to play.",
            "question_tanglish": "Football aadalaama?",
            "question_tamil": "ஃபுட்பால் ஆடலாமா?",
            "expected_answers": [
                "Va da", "Aadalaama", "Seri da",
                "Aama da", "Ok da", "Polaam da"
            ],
            "model_answer": "Va da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_08",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Sharing",
            "social_story": "You have two chocolates. Your friend asks if you can share one.",
            "question_tanglish": "Oru chocolate kudutha?",
            "question_tamil": "ஒரு சாக்லேட் குடுத்தா?",
            "expected_answers": [
                "Idho da", "Seri da eduthuko", "Eduthuko da",
                "Kudukuren da", "Aama da"
            ],
            "model_answer": "Idho da, eduthuko",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_09",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Shopping",
            "social_story": "Your friend wants to go to the nearby shop to buy something.",
            "question_tanglish": "Shopping polaama?",
            "question_tamil": "ஷாப்பிங் போலாமா?",
            "expected_answers": [
                "Polaam da", "Va da", "Seri da",
                "Aama da", "Ok da"
            ],
            "model_answer": "Polaam da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_10",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Photo",
            "social_story": "You and your friend are at a park. They want to take a photo.",
            "question_tanglish": "Photo edukalaama?",
            "question_tamil": "ஃபோட்டோ எடுக்கலாமா?",
            "expected_answers": [
                "Seri da", "Edukkalaam", "Va da",
                "Aama da", "Ok da"
            ],
            "model_answer": "Seri da, edukkalaam",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_11",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Homework Help",
            "social_story": "Your friend is stuck on homework. They ask if you can help.",
            "question_tanglish": "Homework la help pannuva?",
            "question_tamil": "ஹோம்வொர்க் ல ஹெல்ப் பண்ணுவா?",
            "expected_answers": [
                "Pannuren da", "Seri da", "Va da paappom",
                "Aama da", "Help pannuren"
            ],
            "model_answer": "Pannuren da",
            "respect_required": False,
            "difficulty": 2
        },
        {
            "id": "friend_12",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Birthday",
            "social_story": "Your friend invites you to their birthday party.",
            "question_tanglish": "En birthday party ku varuva?",
            "question_tamil": "என் பர்த்டே பார்ட்டி க்கு வருவா?",
            "expected_answers": [
                "Varen da", "Seri da", "Aama da",
                "Happy birthday da", "Definitely da"
            ],
            "model_answer": "Varen da, happy birthday!",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_13",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Sorry",
            "social_story": "Your friend accidentally broke your pencil. They say sorry.",
            "question_tanglish": "Sorry da, unoda pencil odanjiduchu.",
            "question_tamil": "ஸாரி டா, உனோட பென்சில் ஒடைஞ்சிடுச்சு.",
            "expected_answers": [
                "Paravala da", "Parava illa da", "Ok da",
                "Pothum da", "No problem da", "Its ok da"
            ],
            "model_answer": "Paravala da",
            "respect_required": False,
            "difficulty": 2
        },
        {
            "id": "friend_14",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Thanks",
            "social_story": "Your friend shared their lunch with you.",
            "question_tanglish": "Naan share pannava unakku?",
            "question_tamil": "நான் ஷேர் பண்ணவா உனக்கு?",
            "expected_answers": [
                "Thanks da", "Thank you da", "Seri da",
                "Aama da", "Romba thanks da"
            ],
            "model_answer": "Thanks da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_15",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Race",
            "social_story": "You and your friend are in the park. They challenge you to a race.",
            "question_tanglish": "Race podalaama?",
            "question_tamil": "ரேஸ் போடலாமா?",
            "expected_answers": [
                "Va da", "Podalaama", "Seri da",
                "Aama da", "Ok da", "Ready da"
            ],
            "model_answer": "Va da, podalaama",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_16",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Drawing",
            "social_story": "Your friend wants to draw pictures together.",
            "question_tanglish": "Drawing podalaama?",
            "question_tamil": "ட்ராயிங் போடலாமா?",
            "expected_answers": [
                "Podalaama", "Va da", "Seri da",
                "Aama da", "Ok da"
            ],
            "model_answer": "Podalaama da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_17",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Hide and Seek",
            "social_story": "Your friend wants to play hide and seek.",
            "question_tanglish": "Hide and seek aadalaama?",
            "question_tamil": "ஹைட் அண்ட் சீக் ஆடலாமா?",
            "expected_answers": [
                "Aadalaama", "Va da", "Seri da",
                "Aama da", "Ok da", "Polaam da"
            ],
            "model_answer": "Va da, aadalaama",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_18",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Study Together",
            "social_story": "Exam is coming. Your friend asks if you want to study together.",
            "question_tanglish": "Serndhu padikalaama?",
            "question_tamil": "சேர்ந்து படிக்கலாமா?",
            "expected_answers": [
                "Padikalaama", "Seri da", "Va da",
                "Aama da", "Polaam da"
            ],
            "model_answer": "Seri da, padikalaama",
            "respect_required": False,
            "difficulty": 2
        },
        {
            "id": "friend_19",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Ice Cream",
            "social_story": "It is a hot day. Your friend asks if you want to get ice cream.",
            "question_tanglish": "Ice cream saapdalama?",
            "question_tamil": "ஐஸ் கிரீம் சாப்பிடலாமா?",
            "expected_answers": [
                "Saapdalaam da", "Polaam da", "Va da",
                "Seri da", "Aama da"
            ],
            "model_answer": "Polaam da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_20",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Book Exchange",
            "social_story": "Your friend has a storybook. They ask if you want to borrow it.",
            "question_tanglish": "Idhu nalla book da, padikuriya?",
            "question_tamil": "இது நல்ல புக் டா, படிக்குறியா?",
            "expected_answers": [
                "Seri da kudu", "Aama da", "Padikuren da",
                "Thanks da", "Kudu da"
            ],
            "model_answer": "Seri da, thanks",
            "respect_required": False,
            "difficulty": 2
        },
        {
            "id": "friend_21",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Kite",
            "social_story": "It is a windy day. Your friend asks if you want to fly kites.",
            "question_tanglish": "Pattam vidalaama?",
            "question_tamil": "பட்டம் விடலாமா?",
            "expected_answers": [
                "Vidalaama", "Va da", "Seri da",
                "Aama da", "Polaam da"
            ],
            "model_answer": "Va da, vidalaama",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_22",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Waiting",
            "social_story": "Your friend asks you to wait for them after school.",
            "question_tanglish": "School mudinja wait pannu da.",
            "question_tamil": "ஸ்கூல் முடிஞ்சா வெயிட் பண்ணு டா.",
            "expected_answers": [
                "Seri da", "Pannuren da", "Ok da",
                "Aama da", "Wait pannuren da"
            ],
            "model_answer": "Seri da, wait pannuren",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_23",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Singing",
            "social_story": "Your friend hears a nice song. They ask if you want to sing together.",
            "question_tanglish": "Paatu paadalaama?",
            "question_tamil": "பாட்டு பாடலாமா?",
            "expected_answers": [
                "Paadalaama", "Va da", "Seri da",
                "Aama da", "Ok da"
            ],
            "model_answer": "Va da, paadalaama",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_24",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Walk",
            "social_story": "After school, your friend asks if you want to walk home together.",
            "question_tanglish": "Serndhu veettukku polaama?",
            "question_tamil": "சேர்ந்து வீட்டுக்கு போலாமா?",
            "expected_answers": [
                "Polaam da", "Seri da", "Va da",
                "Aama da", "Ok da"
            ],
            "model_answer": "Polaam da",
            "respect_required": False,
            "difficulty": 1
        },
        {
            "id": "friend_25",
            "character": "Friend",
            "avatar": "👦",
            "lesson": "Bye",
            "social_story": "It is time to go home. Your friend says bye to you.",
            "question_tanglish": "Bye da, naalaikku paappom.",
            "question_tamil": "பை டா, நாளைக்கு பாப்போம்.",
            "expected_answers": [
                "Bye da", "Seri da bye", "Naalaikku paappom da",
                "Ok da bye", "Bye machi", "Ta da"
            ],
            "model_answer": "Bye da, naalaikku paappom",
            "respect_required": False,
            "difficulty": 1
        },
    ],

    # ========================================================
    # STRANGER (25 Questions)
    # ========================================================

    "Stranger": [
        {
            "id": "stranger_01",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Post Office",
            "social_story": "You are walking on the road. A person you don't know asks you where the post office is.",
            "question_tanglish": "Post office enga iruku?",
            "question_tamil": "போஸ்ட் ஆபிஸ் எங்க இருக்கு?",
            "expected_answers": [
                "Theriyadhu sir", "Theriyathu sir",
                "Theriyadhu", "Theriyathu",
                "I don't know sir", "Sorry sir theriyadhu",
                "Straight poonga sir", "Left la irukku sir",
                "Right la irukku sir"
            ],
            "model_answer": "Theriyadhu sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_02",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Bus Stand",
            "social_story": "An uncle asks you where the bus stand is.",
            "question_tanglish": "Bus stand enga?",
            "question_tamil": "பஸ் ஸ்டாண்ட் எங்க?",
            "expected_answers": [
                "Straight poonga sir", "Straight sir",
                "Left la sir", "Right la sir",
                "Theriyadhu sir", "Anga sir",
                "Idho sir", "Munnaadi sir"
            ],
            "model_answer": "Straight poonga sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_03",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Thank You Response",
            "social_story": "You helped someone with directions. They say thank you.",
            "question_tanglish": "Nandri, thank you.",
            "question_tamil": "நன்றி, தேங்க் யூ.",
            "expected_answers": [
                "Paravala sir", "Parava illa sir",
                "Welcome sir", "Ok sir",
                "Mention not sir"
            ],
            "model_answer": "Paravala sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_04",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Hospital",
            "social_story": "A worried aunty asks you where the nearest hospital is.",
            "question_tanglish": "Hospital enga iruku?",
            "question_tamil": "ஹாஸ்பிடல் எங்க இருக்கு?",
            "expected_answers": [
                "Straight sir", "Straight poonga sir",
                "Left la irukku sir", "Right la irukku sir",
                "Theriyadhu sir", "Anga irukku sir",
                "Near signal sir"
            ],
            "model_answer": "Straight poonga sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_05",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Library",
            "social_story": "A person asks you where the library is.",
            "question_tanglish": "Library enga?",
            "question_tamil": "லைப்ரெரி எங்க?",
            "expected_answers": [
                "Left la sir", "Left sir",
                "Right la sir", "Straight sir",
                "Theriyadhu sir", "Anga sir"
            ],
            "model_answer": "Left la sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_06",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Railway",
            "social_story": "A traveler with bags asks you for the railway station.",
            "question_tanglish": "Railway station enga?",
            "question_tamil": "ரெயில்வே ஸ்டேஷன் எங்க?",
            "expected_answers": [
                "Right la sir", "Right sir",
                "Left la sir", "Straight sir",
                "Theriyadhu sir", "Anga sir"
            ],
            "model_answer": "Right la sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_07",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Bank",
            "social_story": "An office person asks where the bank is.",
            "question_tanglish": "Bank enga iruku?",
            "question_tamil": "பேங்க் எங்க இருக்கு?",
            "expected_answers": [
                "Near signal sir", "Signal pakkathula sir",
                "Straight poonga sir", "Theriyadhu sir",
                "Left la sir", "Right la sir"
            ],
            "model_answer": "Near signal sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_08",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Hotel",
            "social_story": "A hungry person asks you where a hotel (restaurant) is.",
            "question_tanglish": "Hotel enga iruku?",
            "question_tamil": "ஹோட்டல் எங்க இருக்கு?",
            "expected_answers": [
                "Opposite la sir", "Ethir pakkam sir",
                "Straight sir", "Theriyadhu sir",
                "Anga sir", "Near bus stand sir"
            ],
            "model_answer": "Anga irukku sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_09",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - School",
            "social_story": "A parent asks you where the school is.",
            "question_tanglish": "School enga?",
            "question_tamil": "ஸ்கூல் எங்க?",
            "expected_answers": [
                "Munnaadi sir", "Straight poonga sir",
                "Left la sir", "Anga sir",
                "Theriyadhu sir"
            ],
            "model_answer": "Munnaadi sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_10",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Temple",
            "social_story": "An elderly person asks you where the temple is.",
            "question_tanglish": "Kovil enga?",
            "question_tamil": "கோவில் எங்க?",
            "expected_answers": [
                "Indha road la sir", "Straight poonga sir",
                "Left la sir", "Right la sir",
                "Theriyadhu sir", "Anga sir"
            ],
            "model_answer": "Indha road la sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_11",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Time",
            "social_story": "A person on the road asks you what time it is.",
            "question_tanglish": "Time enna?",
            "question_tamil": "டைம் என்ன?",
            "expected_answers": [
                "Theriyadhu sir", "Watch illa sir",
                "Phone parunga sir", "Sorry sir theriyadhu"
            ],
            "model_answer": "Theriyadhu sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_12",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Greeting",
            "social_story": "Your neighbor's friend sees you and says hello.",
            "question_tanglish": "Hello, eppadi irukke?",
            "question_tamil": "ஹலோ, எப்படி இருக்கே?",
            "expected_answers": [
                "Nalla irukken sir", "Fine sir",
                "Nallaa irukkean sir", "Good sir",
                "Ok sir"
            ],
            "model_answer": "Nalla irukken sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_13",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Shop",
            "social_story": "You are at a shop. The shopkeeper asks what you want.",
            "question_tanglish": "Enna venum?",
            "question_tamil": "என்ன வேணும்?",
            "expected_answers": [
                "Pencil venum sir", "Notebook venum sir",
                "Water venum sir", "Chocolate venum sir",
                "Biscuit venum sir", "Idhu venum sir"
            ],
            "model_answer": "Pencil venum sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_14",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Bus",
            "social_story": "You are at the bus stop. The bus conductor asks where you are going.",
            "question_tanglish": "Enga ponum?",
            "question_tamil": "எங்க போணும்?",
            "expected_answers": [
                "School sir", "Veetukku sir",
                "Bus stand sir", "Town sir",
                "Kovil sir"
            ],
            "model_answer": "School sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_15",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Help",
            "social_story": "An elderly person drops their bag. They ask for your help.",
            "question_tanglish": "Konjam help pannuva?",
            "question_tamil": "கொஞ்சம் ஹெல்ப் பண்ணுவா?",
            "expected_answers": [
                "Seri sir", "Pannuren sir", "Aama sir",
                "Idho sir", "Kudukuren sir"
            ],
            "model_answer": "Seri sir, pannuren",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_16",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Name",
            "social_story": "A new person in your street asks your name.",
            "question_tanglish": "Unoda peyar enna?",
            "question_tamil": "உனோட பெயர் என்ன?",
            "expected_answers": [
                "En peyar sir", "Solluven sir",
                "En peyar", "Peyar solluven sir"
            ],
            "model_answer": "En peyar ... sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_17",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "School Ask",
            "social_story": "A new neighbor asks which school you go to.",
            "question_tanglish": "Enga school?",
            "question_tamil": "எங்க ஸ்கூல்?",
            "expected_answers": [
                "Anga sir", "Pakkathula sir",
                "Near sir", "Idho school sir",
                "School peyar solluven sir"
            ],
            "model_answer": "Anga sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_18",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Excuse Me",
            "social_story": "You need to pass through a crowded area. You need to say excuse me.",
            "question_tanglish": "Vazhividunga.",
            "question_tamil": "வழிவிடுங்க.",
            "expected_answers": [
                "Excuse me sir", "Excuse me",
                "Please sir", "Konjam vazhividunga sir",
                "Sorry sir"
            ],
            "model_answer": "Excuse me sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_19",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Directions - Park",
            "social_story": "A family asks you where the nearby park is.",
            "question_tanglish": "Park enga iruku?",
            "question_tamil": "பார்க் எங்க இருக்கு?",
            "expected_answers": [
                "Anga irukku sir", "Straight poonga sir",
                "Left la sir", "Theriyadhu sir",
                "Near sir"
            ],
            "model_answer": "Anga irukku sir",
            "respect_required": True,
            "difficulty": 1
        },
        {
            "id": "stranger_20",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Auto",
            "social_story": "You need to take an auto. The auto driver asks where you want to go.",
            "question_tanglish": "Enga ponum?",
            "question_tamil": "எங்க போணும்?",
            "expected_answers": [
                "School sir", "Veetukku sir",
                "Bus stand sir", "Hospital sir",
                "Kovil sir", "Market sir"
            ],
            "model_answer": "School sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_21",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Lost",
            "social_story": "You got separated from your parent. A kind person asks if you are okay.",
            "question_tanglish": "Nee ok va? Yaaru kooda vandha?",
            "question_tamil": "நீ ஓகே வா? யாரு கூட வந்த?",
            "expected_answers": [
                "Appa kooda sir", "Amma kooda sir",
                "En appa sir", "En amma sir",
                "Parent kooda sir"
            ],
            "model_answer": "Appa kooda vandhen sir",
            "respect_required": True,
            "difficulty": 3
        },
        {
            "id": "stranger_22",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Polite Decline",
            "social_story": "A stranger offers you candy. You should politely say no.",
            "question_tanglish": "Chocolate venum?",
            "question_tamil": "சாக்லேட் வேணுமா?",
            "expected_answers": [
                "Vendaam sir", "Illa sir", "Vendaam thanks sir",
                "No thank you sir", "Vendaam nandri sir"
            ],
            "model_answer": "Vendaam sir, nandri",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_23",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Compliment",
            "social_story": "An aunty in the neighborhood says you look nice today.",
            "question_tanglish": "Romba azhaga irukke!",
            "question_tamil": "ரொம்ப அழகா இருக்கே!",
            "expected_answers": [
                "Thank you aunty", "Thanks aunty",
                "Nandri aunty", "Thank you sir",
                "Thanks"
            ],
            "model_answer": "Thank you aunty",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_24",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Water Request",
            "social_story": "A thirsty person asks you if they can get water nearby.",
            "question_tanglish": "Thanni kidaikuma inga?",
            "question_tamil": "தண்ணி கிடைக்குமா இங்க?",
            "expected_answers": [
                "Anga sir", "Kadai la sir",
                "Inga irukku sir", "Theriyadhu sir",
                "Idho sir"
            ],
            "model_answer": "Anga irukku sir",
            "respect_required": True,
            "difficulty": 2
        },
        {
            "id": "stranger_25",
            "character": "Stranger",
            "avatar": "🧑",
            "lesson": "Goodbye",
            "social_story": "A kind uncle helped you find your way. He says goodbye.",
            "question_tanglish": "Seri, poi va, careful.",
            "question_tamil": "சரி, போய் வா, கேர்ஃபுல்.",
            "expected_answers": [
                "Thank you sir", "Thanks sir", "Nandri sir",
                "Romba nandri sir", "Thank you uncle",
                "Bye sir"
            ],
            "model_answer": "Thank you sir",
            "respect_required": True,
            "difficulty": 1
        },
    ]
}


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def get_all_characters():
    """Return list of available characters with metadata."""
    characters = []
    for char_name, questions in QUESTIONS.items():
        if questions:
            characters.append({
                "name": char_name,
                "avatar": questions[0]["avatar"],
                "total_questions": len(questions),
                "description": f"Practice talking to {char_name}"
            })
    return characters


def get_questions_for_character(character):
    """Return all questions for a given character."""
    return [_merge_json_lesson(q) for q in QUESTIONS.get(character, [])]


def get_question_by_id(question_id):
    """Find a question by its ID across all characters."""
    for character, questions in QUESTIONS.items():
        for q in questions:
            if q["id"] == question_id:
                return _merge_json_lesson(q)
    return None


def get_question_count():
    """Return total number of questions."""
    return sum(len(qs) for qs in QUESTIONS.values())


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("QUESTION BANK SUMMARY")
    print("=" * 60)

    for char in get_all_characters():
        print(f"\n{char['avatar']} {char['name']}: {char['total_questions']} questions")

    print(f"\nTotal Questions: {get_question_count()}")
    print("=" * 60)
