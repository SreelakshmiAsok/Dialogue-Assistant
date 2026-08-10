# ============================================================
# SCENARIOS
# ============================================================

SCENARIOS = {
    "1": {
        "scenario_id": "1",
        "character": "Parent",
        "avatar": "Dad",
        "lesson": "Shopping",
        "question": "En kooda kadaiki variya?",
        "expected_answers": [
            "Varen appa",
            "Varan appa",
            "Varaen appa",
            "Varraen appa",
            "Seri appa",
            "Aama appa"
        ],
        "respect_required": True
    },

    "2": {
        "scenario_id": "2",
        "character": "Parent",
        "avatar": "Dad",
        "lesson": "Home",
        "question": "Saaptiya?",
        "expected_answers": [
            "Saaptaen appa",
            "Saapten appa",
            "Saptaen appa",
            "Sapten appa",
            "Aama appa",
            "Illa appa"
        ],
        "respect_required": True
    },

    "3": {
        "scenario_id": "3",
        "character": "Teacher",
        "avatar": "Teacher",
        "lesson": "Classroom",
        "question": "Homework mudichacha?",
        "expected_answers": [
            "Aama teacher",
            "Ama teacher",
            "Aama ma'am",
            "Ama ma'am",
            "Aama mam",
            "Ama mam",
            "Mudichiten teacher",
            "Mudichitten teacher",
            "Mudichutten teacher",
            "Mudichiten ma'am",
            "Mudichitten ma'am",
            "Mudichutten ma'am",
            "Mudichiten mam",
            "Mudichitten mam",
            "Mudichutten mam",
            "Seri teacher",
            "Sari teacher",
            "Seri sir",
            "Seri miss",
            "Seri ma'am",
            "Seri mam"
        ],
        "respect_required": True
    },

    "4": {
        "scenario_id": "4",
        "character": "Friend",
        "avatar": "Friend",
        "lesson": "Playtime",
        "question": "Cricket vilayaadalaama?",
        "expected_answers": [
            "Va da",
            "Vaa da",
            "Seri da",
            "Sari da",
            "Aama da",
            "Ama da",
            "Okay da",
            "Ok da",
            "Vilayaadalaam"
        ],
        "respect_required": False
    },

    "5": {
        "scenario_id": "5",
        "character": "Stranger",
        "avatar": "Stranger",
        "lesson": "Road",
        "question": "Post office enga iruku?",
        "expected_answers": [
            "Theriyadhu sir",
            "Theriyathu sir",
            "Theriyadhu",
            "Theriyathu",
            "I don't know sir",
            "Sorry sir theriyadhu"
        ],
        "respect_required": True
    }
}


def get_scenario(scenario_id):
    return SCENARIOS.get(str(scenario_id))


def get_all_scenarios():
    return SCENARIOS


def display_scenarios():
    print("\nAvailable Scenarios:")

    for scenario_id, scenario in SCENARIOS.items():
        print(
            f"{scenario_id}. "
            f"{scenario['character']} - "
            f"{scenario['lesson']}"
        )