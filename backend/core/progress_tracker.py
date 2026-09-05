import csv
import os

PROGRESS_FILE = "datasets/progress.csv"


def get_progress():
    if not os.path.exists(PROGRESS_FILE):
        return []

    with open(PROGRESS_FILE, "r", newline="", encoding="utf-8") as file:
        return list(csv.DictReader(file))


def save_progress(interaction_id, response, correct, stars):
    progress = get_progress()

    updated = False

    for row in progress:
        if row["interaction_id"] == str(interaction_id):
            row["response"] = response
            row["correct"] = str(correct)
            row["stars"] = str(stars)
            updated = True
            break

    if not updated:
        progress.append({
            "interaction_id": str(interaction_id),
            "response": response,
            "correct": str(correct),
            "stars": str(stars)
        })

    with open(PROGRESS_FILE, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=["interaction_id", "response", "correct", "stars"]
        )
        writer.writeheader()
        writer.writerows(progress)


def calculate_total_stars():
    progress = get_progress()
    return sum(int(row["stars"]) for row in progress)


def calculate_accuracy():
    progress = get_progress()

    if not progress:
        return 0

    correct_count = sum(
        1 for row in progress
        if row["correct"].lower() == "true"
    )

    return (correct_count / len(progress)) * 100


if __name__ == "__main__":
    print("=" * 50)
    print("PROGRESS TRACKER TEST")
    print("=" * 50)

    progress = get_progress()

    print("Total Interactions :", len(progress))
    print("Total Stars        :", calculate_total_stars())
    print("Accuracy           :", round(calculate_accuracy(), 2), "%")

    print("=" * 50)
    print("PROGRESS TRACKER TEST COMPLETED")
    print("=" * 50)