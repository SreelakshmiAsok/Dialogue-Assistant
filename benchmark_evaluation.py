"""
TalkWise Benchmark Evaluation Suite
Evaluates 120+ labelled responses across:
  1. Correct responses (socially appropriate, meets scenario expectations)
  2. Incorrect responses (off-topic, semantically wrong, incomplete communication)
  3. Unsafe responses (critical stranger safety compliance, hostile peer aggression, authority disrespect)

Compares three algorithmic variants:
  - Variant A: Pure String & N-gram Text Similarity Baseline (no ontology, no intent verification)
  - Variant B: Heuristic Rules & Intent Classifier Only (no scenario-linked OWL knowledge graph)
  - Variant C: Hybrid Dataset-Linked OWL Ontology + Semantic Engine (Full TalkWise Architecture)
"""

import os
import sys
import json
import re
from difflib import SequenceMatcher

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
sys.path.append(os.path.join(os.path.dirname(__file__), "reasoning"))

from nlp.preprocessing import normalize_text
from engines.semantic_engine import (
    classify_response_intent,
    semantic_match,
    combined_similarity
)
from engines.nlp_semantic_engine import semantic_similarity
from engines.rule_engine import check_pragmatics
from reasoner import SocialOntologyReasoner

# Load Ontology Reasoner
reasoner = SocialOntologyReasoner()

# -------------------------------------------------------------
# 125 Labelled Test Cases (Correct, Incorrect, Unsafe)
# -------------------------------------------------------------
BENCHMARK_ITEMS = [
    # ===== FATHER SCENARIOS (32 cases) =====
    # father_01: Shopping ("En kooda kadaiki variya?")
    {"id": "tc_001", "role": "Father", "scenario_id": "father_01", "context": "Home", "expected": "Varen appa", "input": "Varen appa", "label": "correct"},
    {"id": "tc_002", "role": "Father", "scenario_id": "father_01", "context": "Home", "expected": "Varen appa", "input": "Seri appa varen", "label": "correct"},
    {"id": "tc_003", "role": "Father", "scenario_id": "father_01", "context": "Home", "expected": "Varen appa", "input": "I will come with you dad", "label": "correct"},
    {"id": "tc_004", "role": "Father", "scenario_id": "father_01", "context": "Home", "expected": "Varen appa", "input": "Cricket bat enga", "label": "incorrect"},
    {"id": "tc_005", "role": "Father", "scenario_id": "father_01", "context": "Home", "expected": "Varen appa", "input": "Blue color", "label": "incorrect"},
    {"id": "tc_006", "role": "Father", "scenario_id": "father_01", "context": "Home", "expected": "Varen appa", "input": "Get lost, shut up", "label": "unsafe"},
    {"id": "tc_007", "role": "Father", "scenario_id": "father_01", "context": "Home", "expected": "Varen appa", "input": "Poda dei", "label": "unsafe"},

    # father_02: Meals ("Saaptiya?")
    {"id": "tc_008", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "Saaptaen appa", "label": "correct"},
    {"id": "tc_009", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "Aama pa saapitten", "label": "correct"},
    {"id": "tc_010", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "Innum saapala appa, ippo saapudren", "label": "correct"},
    {"id": "tc_011", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "Naan saapitten paa, neenga saaptiya?", "label": "correct"},
    {"id": "tc_012", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "Neenga saaptiya?", "label": "incorrect"}, # Pure question back without answering
    {"id": "tc_013", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "School la pencil tholanjiduchu", "label": "incorrect"},
    {"id": "tc_014", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "5 minutes appa", "label": "incorrect"}, # Contextual request is not eating answer
    {"id": "tc_015", "role": "Father", "scenario_id": "father_02", "context": "Meals", "expected": "Saaptaen appa", "input": "Saapada maten poda!", "label": "unsafe"},

    # father_03: Chores ("TV off pannuva?")
    {"id": "tc_016", "role": "Father", "scenario_id": "father_03", "context": "Home", "expected": "Seri appa", "input": "Seri appa off panren", "label": "correct"},
    {"id": "tc_017", "role": "Father", "scenario_id": "father_03", "context": "Home", "expected": "Seri appa", "input": "Idho panren pa", "label": "correct"},
    {"id": "tc_018", "role": "Father", "scenario_id": "father_03", "context": "Home", "expected": "Seri appa", "input": "TV nalla irukku", "label": "incorrect"},
    {"id": "tc_019", "role": "Father", "scenario_id": "father_03", "context": "Home", "expected": "Seri appa", "input": "Remote enga", "label": "incorrect"},
    {"id": "tc_020", "role": "Father", "scenario_id": "father_03", "context": "Home", "expected": "Seri appa", "input": "Mudiyadhu poda, un vela paaru", "label": "unsafe"},

    # father_05: Homework ("Homework mudichacha?")
    {"id": "tc_021", "role": "Father", "scenario_id": "father_05", "context": "Home", "expected": "Mudichiten appa", "input": "Mudichiten appa", "label": "correct"},
    {"id": "tc_022", "role": "Father", "scenario_id": "father_05", "context": "Home", "expected": "Mudichiten appa", "input": "Aama pa, fulla mudichuten", "label": "correct"},
    {"id": "tc_023", "role": "Father", "scenario_id": "father_05", "context": "Home", "expected": "Mudichiten appa", "input": "Innum mudikala pa, ippo panren", "label": "correct"},
    {"id": "tc_024", "role": "Father", "scenario_id": "father_05", "context": "Home", "expected": "Mudichiten appa", "input": "Tomorrow holiday", "label": "incorrect"},
    {"id": "tc_025", "role": "Father", "scenario_id": "father_05", "context": "Home", "expected": "Mudichiten appa", "input": "Pannave maten poda stupid", "label": "unsafe"},

    # t2_father_01: Screen transition negotiation
    {"id": "tc_026", "role": "Father", "scenario_id": "t2_father_01", "context": "Home", "expected": "Innum 5 minutes pa", "input": "Innum 5 minutes pa, please", "label": "correct"},
    {"id": "tc_027", "role": "Father", "scenario_id": "t2_father_01", "context": "Home", "expected": "Innum 5 minutes pa", "input": "Konjam time kudunga appa", "label": "correct"},
    {"id": "tc_028", "role": "Father", "scenario_id": "t2_father_01", "context": "Home", "expected": "Innum 5 minutes pa", "input": "panren 15", "label": "incorrect"}, # Substring trap
    {"id": "tc_029", "role": "Father", "scenario_id": "t2_father_01", "context": "Home", "expected": "Innum 5 minutes pa", "input": "Shut up, I am watching!", "label": "unsafe"},

    # t2_father_02: Polite Interruption
    {"id": "tc_030", "role": "Father", "scenario_id": "t2_father_02", "context": "Home", "expected": "Excuse me appa", "input": "Excuse me appa, oru help", "label": "correct"},
    {"id": "tc_031", "role": "Father", "scenario_id": "t2_father_02", "context": "Home", "expected": "Excuse me appa", "input": "Appa appa phone vai!", "label": "incorrect"},
    {"id": "tc_032", "role": "Father", "scenario_id": "t2_father_02", "context": "Home", "expected": "Excuse me appa", "input": "Stop talking and look at me stupid", "label": "unsafe"},

    # ===== TEACHER SCENARIOS (31 cases) =====
    # teacher_01: Greeting ("Good morning! Ulla vaanga.")
    {"id": "tc_033", "role": "Teacher", "scenario_id": "teacher_01", "context": "Classroom", "expected": "Good morning teacher", "input": "Good morning teacher", "label": "correct"},
    {"id": "tc_034", "role": "Teacher", "scenario_id": "teacher_01", "context": "Classroom", "expected": "Good morning teacher", "input": "Good morning Ms. Priya!", "label": "correct"},
    {"id": "tc_035", "role": "Teacher", "scenario_id": "teacher_01", "context": "Classroom", "expected": "Good morning teacher", "input": "Vanakkam teacher", "label": "correct"},
    {"id": "tc_036", "role": "Teacher", "scenario_id": "teacher_01", "context": "Classroom", "expected": "Good morning teacher", "input": "En bag enga", "label": "incorrect"},
    {"id": "tc_037", "role": "Teacher", "scenario_id": "teacher_01", "context": "Classroom", "expected": "Good morning teacher", "input": "Hey man what's up", "label": "unsafe"},
    {"id": "tc_038", "role": "Teacher", "scenario_id": "teacher_01", "context": "Classroom", "expected": "Good morning teacher", "input": "Shut up and move", "label": "unsafe"},

    # teacher_02: Homework check ("Homework mudichacha?")
    {"id": "tc_039", "role": "Teacher", "scenario_id": "teacher_02", "context": "Classroom", "expected": "Aama teacher, mudichiten", "input": "Yes miss, finished homework", "label": "correct"},
    {"id": "tc_040", "role": "Teacher", "scenario_id": "teacher_02", "context": "Classroom", "expected": "Aama teacher, mudichiten", "input": "Mudichiten teacher, idho note", "label": "correct"},
    {"id": "tc_041", "role": "Teacher", "scenario_id": "teacher_02", "context": "Classroom", "expected": "Aama teacher, mudichiten", "input": "I play cricket yesterday", "label": "incorrect"},
    {"id": "tc_042", "role": "Teacher", "scenario_id": "teacher_02", "context": "Classroom", "expected": "Aama teacher, mudichiten", "input": "Mudiyadhu teacher poda", "label": "unsafe"},

    # teacher_04: Understanding ("Question purinjutha?")
    {"id": "tc_043", "role": "Teacher", "scenario_id": "teacher_04", "context": "Classroom", "expected": "Purinjuthu teacher", "input": "Purinjuthu miss", "label": "correct"},
    {"id": "tc_044", "role": "Teacher", "scenario_id": "teacher_04", "context": "Classroom", "expected": "Purinjuthu teacher", "input": "Innum puriyala teacher, clarify please", "label": "correct"},
    {"id": "tc_045", "role": "Teacher", "scenario_id": "teacher_04", "context": "Classroom", "expected": "Purinjuthu teacher", "input": "Yellow color pencil", "label": "incorrect"},
    {"id": "tc_046", "role": "Teacher", "scenario_id": "teacher_04", "context": "Classroom", "expected": "Purinjuthu teacher", "input": "Whatever, boring class", "label": "unsafe"},

    # teacher_11: Attendance ("Present ah?")
    {"id": "tc_047", "role": "Teacher", "scenario_id": "teacher_11", "context": "Classroom", "expected": "Present teacher", "input": "Present teacher", "label": "correct"},
    {"id": "tc_048", "role": "Teacher", "scenario_id": "teacher_11", "context": "Classroom", "expected": "Present teacher", "input": "Present sir", "label": "correct"},
    {"id": "tc_049", "role": "Teacher", "scenario_id": "teacher_11", "context": "Classroom", "expected": "Present teacher", "input": "No I don't want", "label": "incorrect"},
    {"id": "tc_050", "role": "Teacher", "scenario_id": "teacher_11", "context": "Classroom", "expected": "Present teacher", "input": "Hey stop shouting my name", "label": "unsafe"},

    # teacher_12: Permission ("Enna venum?")
    {"id": "tc_051", "role": "Teacher", "scenario_id": "teacher_12", "context": "Classroom", "expected": "Bathroom ponum teacher", "input": "May I go to the restroom miss?", "label": "correct"},
    {"id": "tc_052", "role": "Teacher", "scenario_id": "teacher_12", "context": "Classroom", "expected": "Bathroom ponum teacher", "input": "Thanni kudikanum miss, please", "label": "correct"},
    {"id": "tc_053", "role": "Teacher", "scenario_id": "teacher_12", "context": "Classroom", "expected": "Bathroom ponum teacher", "input": "Bell ring aachu", "label": "incorrect"},
    {"id": "tc_054", "role": "Teacher", "scenario_id": "teacher_12", "context": "Classroom", "expected": "Bathroom ponum teacher", "input": "Gimme pass right now", "label": "unsafe"},

    # teacher_15: Quiet ("Silence please.")
    {"id": "tc_055", "role": "Teacher", "scenario_id": "teacher_15", "context": "Classroom", "expected": "Sorry teacher", "input": "Sorry teacher, quiet ah irukken", "label": "correct"},
    {"id": "tc_056", "role": "Teacher", "scenario_id": "teacher_15", "context": "Classroom", "expected": "Sorry teacher", "input": "Yes teacher sorry", "label": "correct"},
    {"id": "tc_057", "role": "Teacher", "scenario_id": "teacher_15", "context": "Classroom", "expected": "Sorry teacher", "input": "Avan dhaan pesunan", "label": "incorrect"},
    {"id": "tc_058", "role": "Teacher", "scenario_id": "teacher_15", "context": "Classroom", "expected": "Sorry teacher", "input": "You shut up first teacher", "label": "unsafe"},

    # t2_teacher_01: Requesting Restroom
    {"id": "tc_059", "role": "Teacher", "scenario_id": "t2_teacher_01", "context": "Classroom", "expected": "May I go to washroom teacher", "input": "Excuse me miss, may I go to washroom please?", "label": "correct"},
    {"id": "tc_060", "role": "Teacher", "scenario_id": "t2_teacher_01", "context": "Classroom", "expected": "May I go to washroom teacher", "input": "I am walking outside", "label": "incorrect"},
    {"id": "tc_061", "role": "Teacher", "scenario_id": "t2_teacher_01", "context": "Classroom", "expected": "May I go to washroom teacher", "input": "Going out stupid lady", "label": "unsafe"},

    # t2_teacher_03: Apologizing for late
    {"id": "tc_062", "role": "Teacher", "scenario_id": "t2_teacher_03", "context": "Classroom", "expected": "Sorry for being late teacher", "input": "Sorry teacher for coming late, bus delay", "label": "correct"},
    {"id": "tc_063", "role": "Teacher", "scenario_id": "t2_teacher_03", "context": "Classroom", "expected": "Sorry for being late teacher", "input": "Why you look at me like that stupid", "label": "unsafe"},

    # ===== FRIEND / PEER SCENARIOS (31 cases) =====
    # friend_01: Cricket ("Cricket vilayaadalaama?")
    {"id": "tc_064", "role": "Friend", "scenario_id": "friend_01", "context": "Playground", "expected": "Va da, vilayaadalaam", "input": "Va da, vilayaadalaam", "label": "correct"},
    {"id": "tc_065", "role": "Friend", "scenario_id": "friend_01", "context": "Playground", "expected": "Va da, vilayaadalaam", "input": "Vaa vaadaa vilayadalam", "label": "correct"},
    {"id": "tc_066", "role": "Friend", "scenario_id": "friend_01", "context": "Playground", "expected": "Va da, vilayaadalaam", "input": "Ippo mudiyadhu da, apram polaam", "label": "correct"}, # Polite refusal is valid
    {"id": "tc_067", "role": "Friend", "scenario_id": "friend_01", "context": "Playground", "expected": "Va da, vilayaadalaam", "input": "Maths homework page 10", "label": "incorrect"},
    {"id": "tc_068", "role": "Friend", "scenario_id": "friend_01", "context": "Playground", "expected": "Va da, vilayaadalaam", "input": "No way get lost stupid!", "label": "unsafe"},
    {"id": "tc_069", "role": "Friend", "scenario_id": "friend_01", "context": "Playground", "expected": "Va da, vilayaadalaam", "input": "Get lost it is mine, I hate you", "label": "unsafe"},

    # friend_04: Games ("Game aadalaama?")
    {"id": "tc_070", "role": "Friend", "scenario_id": "friend_04", "context": "Playground", "expected": "Va da, aadalaam", "input": "Sure da, serndhu aadalaam", "label": "correct"},
    {"id": "tc_071", "role": "Friend", "scenario_id": "friend_04", "context": "Playground", "expected": "Va da, aadalaam", "input": "Car race game aadalam", "label": "correct"},
    {"id": "tc_072", "role": "Friend", "scenario_id": "friend_04", "context": "Playground", "expected": "Va da, aadalaam", "input": "Shoe lace loose ah irukku", "label": "incorrect"},
    {"id": "tc_073", "role": "Friend", "scenario_id": "friend_04", "context": "Playground", "expected": "Va da, aadalaam", "input": "Unkooda aadave maten, poda looser", "label": "unsafe"},

    # friend_08: Sharing ("Oru chocolate kudutha?")
    {"id": "tc_074", "role": "Friend", "scenario_id": "friend_08", "context": "Playground", "expected": "Idho da, eduthuko", "input": "Idho da, half share panren", "label": "correct"},
    {"id": "tc_075", "role": "Friend", "scenario_id": "friend_08", "context": "Playground", "expected": "Idho da, eduthuko", "input": "Sure take this piece", "label": "correct"},
    {"id": "tc_076", "role": "Friend", "scenario_id": "friend_08", "context": "Playground", "expected": "Idho da, eduthuko", "input": "Weather is hot today", "label": "incorrect"},
    {"id": "tc_077", "role": "Friend", "scenario_id": "friend_08", "context": "Playground", "expected": "Idho da, eduthuko", "input": "Poda greedy beggar, ellam enakku dhaan", "label": "unsafe"},

    # friend_13: Apology response ("Sorry da, unoda pencil odanjiduchu.")
    {"id": "tc_078", "role": "Friend", "scenario_id": "friend_13", "context": "Playground", "expected": "Paravala da", "input": "Paravala da, no problem", "label": "correct"},
    {"id": "tc_079", "role": "Friend", "scenario_id": "friend_13", "context": "Playground", "expected": "Paravala da", "input": "It's okay da, sharp pannikiren", "label": "correct"},
    {"id": "tc_080", "role": "Friend", "scenario_id": "friend_13", "context": "Playground", "expected": "Paravala da", "input": "Bus stand enga", "label": "incorrect"},
    {"id": "tc_081", "role": "Friend", "scenario_id": "friend_13", "context": "Playground", "expected": "Paravala da", "input": "Stupid idiot! Adippen unna", "label": "unsafe"},

    # t2_friend_01: Entering game / Turn taking
    {"id": "tc_082", "role": "Friend", "scenario_id": "t2_friend_01", "context": "Playground", "expected": "Can I join next turn?", "input": "Can I join the game next turn please?", "label": "correct"},
    {"id": "tc_083", "role": "Friend", "scenario_id": "t2_friend_01", "context": "Playground", "expected": "Can I join next turn?", "input": "Naanum batting panren da next", "label": "correct"},
    {"id": "tc_084", "role": "Friend", "scenario_id": "t2_friend_01", "context": "Playground", "expected": "Can I join next turn?", "input": "Eating apple", "label": "incorrect"},
    {"id": "tc_085", "role": "Friend", "scenario_id": "t2_friend_01", "context": "Playground", "expected": "Can I join next turn?", "input": "Move away it is my bat get lost!", "label": "unsafe"},

    # t2_friend_02: Peer Empathy (Friend hurt)
    {"id": "tc_086", "role": "Friend", "scenario_id": "t2_friend_02", "context": "Playground", "expected": "Are you okay?", "input": "Are you okay da? Valikudha? Teacher ah kupudren", "label": "correct"},
    {"id": "tc_087", "role": "Friend", "scenario_id": "t2_friend_02", "context": "Playground", "expected": "Are you okay?", "input": "Ennachu da? Help venuma?", "label": "correct"},
    {"id": "tc_088", "role": "Friend", "scenario_id": "t2_friend_02", "context": "Playground", "expected": "Are you okay?", "input": "My shoe is new", "label": "incorrect"},
    {"id": "tc_089", "role": "Friend", "scenario_id": "t2_friend_02", "context": "Playground", "expected": "Are you okay?", "input": "Haha nalla venum unakku!", "label": "unsafe"},

    # ===== STRANGER SCENARIOS (36 cases) =====
    # stranger_01: Directions ("Post office enga iruku?")
    {"id": "tc_090", "role": "Stranger", "scenario_id": "stranger_01", "context": "Road", "expected": "Theriyadhu sir", "input": "Straight poonga sir", "label": "correct"},
    {"id": "tc_091", "role": "Stranger", "scenario_id": "stranger_01", "context": "Road", "expected": "Theriyadhu sir", "input": "Theriyadhu sir", "label": "correct"},
    {"id": "tc_092", "role": "Stranger", "scenario_id": "stranger_01", "context": "Road", "expected": "Theriyadhu sir", "input": "Left la irukku sir", "label": "correct"},
    {"id": "tc_093", "role": "Stranger", "scenario_id": "stranger_01", "context": "Road", "expected": "Theriyadhu sir", "input": "I don't know sir", "label": "correct"},
    {"id": "tc_094", "role": "Stranger", "scenario_id": "stranger_01", "context": "Road", "expected": "Theriyadhu sir", "input": "Cricket bat", "label": "incorrect"},
    {"id": "tc_095", "role": "Stranger", "scenario_id": "stranger_01", "context": "Road", "expected": "Theriyadhu sir", "input": "Sure uncle I love chocolate and puppy", "label": "unsafe"}, # Unsolicited danger acceptance
    {"id": "tc_096", "role": "Stranger", "scenario_id": "stranger_01", "context": "Road", "expected": "Theriyadhu sir", "input": "Shut up stupid uncle go away", "label": "unsafe"},

    # stranger_02: Directions - Bus Stand ("Bus stand enga?")
    {"id": "tc_097", "role": "Stranger", "scenario_id": "stranger_02", "context": "Road", "expected": "Straight poonga sir", "input": "Straight poonga sir", "label": "correct"},
    {"id": "tc_098", "role": "Stranger", "scenario_id": "stranger_02", "context": "Road", "expected": "Straight poonga sir", "input": "Theriyadhu sir", "label": "correct"},
    {"id": "tc_099", "role": "Stranger", "scenario_id": "stranger_02", "context": "Road", "expected": "Straight poonga sir", "input": "Munnaadi irukku sir", "label": "correct"},
    {"id": "tc_100", "role": "Stranger", "scenario_id": "stranger_02", "context": "Road", "expected": "Straight poonga sir", "input": "Apple saapten", "label": "incorrect"},
    {"id": "tc_101", "role": "Stranger", "scenario_id": "stranger_02", "context": "Road", "expected": "Straight poonga sir", "input": "I will get in your car", "label": "unsafe"},

    # stranger_03: Courtesy ("Nandri, thank you.")
    {"id": "tc_102", "role": "Stranger", "scenario_id": "stranger_03", "context": "Road", "expected": "Paravala sir", "input": "Paravala sir", "label": "correct"},
    {"id": "tc_103", "role": "Stranger", "scenario_id": "stranger_03", "context": "Road", "expected": "Paravala sir", "input": "Welcome sir", "label": "correct"},
    {"id": "tc_104", "role": "Stranger", "scenario_id": "stranger_03", "context": "Road", "expected": "Paravala sir", "input": "Ok sir", "label": "correct"},
    {"id": "tc_105", "role": "Stranger", "scenario_id": "stranger_03", "context": "Road", "expected": "Paravala sir", "input": "Enakku time theriyadhu", "label": "incorrect"},
    {"id": "tc_106", "role": "Stranger", "scenario_id": "stranger_03", "context": "Road", "expected": "Paravala sir", "input": "Poda panni", "label": "unsafe"},

    # stranger_11: Time Inquiry ("Time enna?")
    {"id": "tc_107", "role": "Stranger", "scenario_id": "stranger_11", "context": "Road", "expected": "Theriyadhu sir", "input": "Theriyadhu sir, watch illa", "label": "correct"},
    {"id": "tc_108", "role": "Stranger", "scenario_id": "stranger_11", "context": "Road", "expected": "Theriyadhu sir", "input": "Sorry sir theriyadhu", "label": "correct"},
    {"id": "tc_109", "role": "Stranger", "scenario_id": "stranger_11", "context": "Road", "expected": "Theriyadhu sir", "input": "Green color bus", "label": "incorrect"},
    {"id": "tc_110", "role": "Stranger", "scenario_id": "stranger_11", "context": "Road", "expected": "Theriyadhu sir", "input": "Don't ask me stupid person", "label": "unsafe"},

    # stranger_22: CRITICAL STRANGER LURE ("Chocolate venum?")
    {"id": "tc_111", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "Vendaam sir, nandri", "label": "correct"},
    {"id": "tc_112", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "No thank you sir, en amma kitta poren", "label": "correct"},
    {"id": "tc_113", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "No sir, en appa thittuvaanga", "label": "correct"},
    {"id": "tc_114", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "Illa sir vendaam", "label": "correct"},
    {"id": "tc_115", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "Straight poonga sir", "label": "incorrect"}, # Doesn't address candy
    {"id": "tc_116", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "Yes give me chocolate and candy!", "label": "unsafe"}, # CRITICAL VIOLATION
    {"id": "tc_117", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "Sure uncle, ok", "label": "unsafe"}, # CRITICAL VIOLATION
    {"id": "tc_118", "role": "Stranger", "scenario_id": "stranger_22", "context": "Street", "expected": "Vendaam sir, nandri", "input": "Aama kudunga chocolate", "label": "unsafe"}, # CRITICAL VIOLATION

    # t2_stranger_01: Stranger Lure & Safe boundary
    {"id": "tc_119", "role": "Stranger", "scenario_id": "t2_stranger_01", "context": "Street", "expected": "No, I am waiting for my mom", "input": "No thank you sir, en amma anga irukaanga", "label": "correct"},
    {"id": "tc_120", "role": "Stranger", "scenario_id": "t2_stranger_01", "context": "Street", "expected": "No, I am waiting for my mom", "input": "I will not come with you, en dad kooda poren", "label": "correct"},
    {"id": "tc_121", "role": "Stranger", "scenario_id": "t2_stranger_01", "context": "Street", "expected": "No, I am waiting for my mom", "input": "Weather is cloudy", "label": "incorrect"},
    {"id": "tc_122", "role": "Stranger", "scenario_id": "t2_stranger_01", "context": "Street", "expected": "No, I am waiting for my mom", "input": "I will come see the puppy, let's go", "label": "unsafe"},
    {"id": "tc_123", "role": "Stranger", "scenario_id": "t2_stranger_01", "context": "Street", "expected": "No, I am waiting for my mom", "input": "Yes uncle take me in your car", "label": "unsafe"},

    # t2_stranger_02: Ride refusal
    {"id": "tc_124", "role": "Stranger", "scenario_id": "t2_stranger_02", "context": "Street", "expected": "No thanks, I will walk with my friends", "input": "No thanks sir, school van la dhaan poven", "label": "correct"},
    {"id": "tc_125", "role": "Stranger", "scenario_id": "t2_stranger_02", "context": "Street", "expected": "No thanks, I will walk with my friends", "input": "Okay sure, open the car door", "label": "unsafe"}
]

# -------------------------------------------------------------
# Variant Runners
# -------------------------------------------------------------

def run_variant_a(item):
    """
    Variant A: Pure Text Similarity & N-gram Match Baseline.
    Judges correctness solely on string/SequenceMatcher similarity >= 0.60.
    No pragmatic rules, no safety checks, no ontology.
    """
    inp = item["input"]
    exp = item["expected"]
    score = SequenceMatcher(None, normalize_text(inp), normalize_text(exp)).ratio()
    
    # If high similarity to expected answer -> pass, else fail
    # Cannot detect safety violations (blind to danger)
    if score >= 0.55 or any(w in normalize_text(inp) for w in normalize_text(exp).split()):
        predicted = "correct"
    else:
        predicted = "incorrect"
    return predicted, {"score": score}

def run_variant_b(item):
    """
    Variant B: NLP Intent Classifier + Static Keyword Rules (No OWL Graph).
    Uses keyword lists and isolated intent heuristics without scenario-individual OWL axioms.
    Subject to substring collisions and ungrounded fallbacks.
    """
    inp = item["input"]
    role = item["role"]
    norm = normalize_text(inp)
    
    # Static keyword safety check
    has_curse = any(w in norm for w in ["shut up", "poda", "panni", "stupid", "idiot", "get lost", "hate"])
    has_danger_accept = any(w in norm for w in ["chocolate", "puppy", "car", "take me", "come with"]) and any(w in norm for w in ["yes", "sure", "ok", "give", "aama", "go"])
    
    if has_curse or (role == "Stranger" and has_danger_accept):
        return "unsafe", {"reason": "keyword_rule"}

    # Basic string or intent match
    sim = semantic_similarity(inp, item["expected"])
    intent = classify_response_intent(inp)
    
    if sim >= 0.70 or intent in ("AnswerQuestion", "task_completion", "social_acceptance"):
        return "correct", {"sim": sim, "intent": intent}
    else:
        return "incorrect", {"sim": sim, "intent": intent}

def run_variant_c(item):
    """
    Variant C: TalkWise Full Architecture.
    Dataset-Generated OWL Individuals + Multi-Signal Verification + Token Pragmatics.
    """
    inp = item["input"]
    role = item["role"]
    sc_id = item["scenario_id"]
    ctx = item["context"]
    exp = item["expected"]

    # 1. Inappropriate language check
    from nlp.bad_words_filter import check_inappropriate
    bad_check = check_inappropriate(inp, role)
    if bad_check["is_inappropriate"]:
        return "unsafe", {"details": "inappropriate_language"}

    # 2. Linguistic feature & intent classification
    intent = classify_response_intent(inp)
    sim = semantic_similarity(inp, exp)
    
    # 3. Pragmatics & Safety Checks
    pragmatics = check_pragmatics(inp, scenario_id=sc_id, expected_answers=[exp], character=role)
    if pragmatics.get("critical_failure"):
        return "unsafe", {"details": "pragmatics_critical_failure"}

    # 3. Ontology Deep Reasoning with Dataset-Linked Scenario Individual
    onto_eval = reasoner.evaluate_utterance(
        role=role,
        context=ctx,
        utterance_text=inp,
        intent=intent,
        has_politeness=True,
        semantic_similarity=sim,
        scenario_id=sc_id
    )

    if onto_eval.get("has_violations"):
        return "unsafe", {"details": onto_eval["inference_details"]}

    # Combined evidence evaluation matching app.py
    semantic_result = semantic_match(inp, {
        "expected": exp,
        "accepted_answers": [exp],
        "response_type": onto_eval.get("expected_goal")
    })
    matched = bool(semantic_result.get("matched"))
    best_semantic = float(semantic_result.get("semantic_score") or 0.0)
    comb_sim = combined_similarity(normalize_text(inp), normalize_text(exp))

    is_match = False
    if onto_eval.get("goal_satisfied") and intent != "unknown":
        is_match = True
    elif onto_eval.get("alternative_accepted"):
        is_match = True
    elif matched and onto_eval.get("is_appropriate"):
        is_match = True
    elif onto_eval.get("is_appropriate") and (sim >= 0.45 or best_semantic >= 0.55 or comb_sim >= 0.60):
        is_match = True
    elif matched and not onto_eval.get("has_violations"):
        is_match = True

    if is_match:
        return "correct", {"details": onto_eval["inference_details"]}
    else:
        return "incorrect", {"details": onto_eval["inference_details"]}

# -------------------------------------------------------------
# Benchmark Evaluation & Metrics Calculator
# -------------------------------------------------------------

def evaluate_variant(name, runner_fn, dataset):
    total = len(dataset)
    correct_preds = 0
    
    # Multi-class breakdown: correct, incorrect, unsafe
    classes = ["correct", "incorrect", "unsafe"]
    tp = {c: 0 for c in classes}
    fp = {c: 0 for c in classes}
    fn = {c: 0 for c in classes}

    unsafe_caught = 0
    total_unsafe = sum(1 for d in dataset if d["label"] == "unsafe")

    for item in dataset:
        actual = item["label"]
        pred, debug = runner_fn(item)

        if pred == actual:
            correct_preds += 1
            tp[actual] += 1
        else:
            fp[pred] += 1
            fn[actual] += 1

        if actual == "unsafe" and pred == "unsafe":
            unsafe_caught += 1

    accuracy = correct_preds / total * 100.0
    
    # Macro F1
    f1s = []
    for c in classes:
        prec = tp[c] / (tp[c] + fp[c]) if (tp[c] + fp[c]) > 0 else 0.0
        rec = tp[c] / (tp[c] + fn[c]) if (tp[c] + fn[c]) > 0 else 0.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0
        f1s.append(f1)
    macro_f1 = sum(f1s) / len(f1s) * 100.0

    unsafe_rate = (unsafe_caught / total_unsafe * 100.0) if total_unsafe > 0 else 0.0

    return {
        "variant": name,
        "total": total,
        "accuracy": round(accuracy, 1),
        "macro_f1": round(macro_f1, 1),
        "unsafe_detection_rate": round(unsafe_rate, 1),
        "tp": tp, "fp": fp, "fn": fn
    }

def main():
    print(f"Loaded {len(BENCHMARK_ITEMS)} benchmark items across Father, Teacher, Friend, and Stranger scenarios.")
    counts = {}
    for item in BENCHMARK_ITEMS:
        counts[item["label"]] = counts.get(item["label"], 0) + 1
    print(f"Distribution: {counts}")

    results = []
    results.append(evaluate_variant("Variant A: Pure Similarity Baseline", run_variant_a, BENCHMARK_ITEMS))
    results.append(evaluate_variant("Variant B: NLP Heuristics & Keywords", run_variant_b, BENCHMARK_ITEMS))
    results.append(evaluate_variant("Variant C: TalkWise Dataset-OWL Hybrid", run_variant_c, BENCHMARK_ITEMS))

    print("\n" + "=" * 80)
    print("BENCHMARK EVALUATION RESULTS TABLE")
    print("=" * 80)
    print(f"{'Variant / Approach':<42} | {'Accuracy':<10} | {'Macro F1':<10} | {'Unsafe Catch':<12}")
    print("-" * 80)
    for r in results:
        print(f"{r['variant']:<42} | {r['accuracy']:>8.1f}% | {r['macro_f1']:>8.1f}% | {r['unsafe_detection_rate']:>10.1f}%")
    print("=" * 80)

    # Save benchmark dataset and results to JSON for reproducibility
    out_path = os.path.join(os.path.dirname(__file__), "benchmark_results.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump({
            "dataset_count": len(BENCHMARK_ITEMS),
            "distribution": counts,
            "results": results
        }, f, indent=2)
    print(f"\nSaved benchmark results to {out_path}")

if __name__ == "__main__":
    main()
