import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app import app

def run_tests():
    with app.test_client() as c:
        print("================ TEST 1 ==================")
        data = {'question_id': 'father_02', 'response': 'Naan saapitten paa, neenga saaptiya?'}
        resp = c.post('/api/evaluate', json=data)
        print("Input:", data['response'])
        print(json.dumps(resp.json, indent=2))
        
        print("\n================ TEST 2 ==================")
        data2 = {'question_id': 'father_02', 'response': 'Saaptaen appa.'}
        resp2 = c.post('/api/evaluate', json=data2)
        print("Input:", data2['response'])
        print(json.dumps(resp2.json, indent=2))
        
        print("\n================ TEST 3 ==================")
        data3 = {'question_id': 'father_02', 'response': 'Naan saapitten appa, neenga saaptiya?'}
        resp3 = c.post('/api/evaluate', json=data3)
        print("Input:", data3['response'])
        print(json.dumps(resp3.json, indent=2))

        print("\n================ TEST 4 ==================")
        data4 = {'question_id': 'father_02', 'response': '5 min appa'}
        resp4 = c.post('/api/evaluate', json=data4)
        print("Input:", data4['response'])
        print(json.dumps(resp4.json, indent=2))

        print("\n================ TEST 5 ==================")
        data5 = {'question_id': 'father_02', 'response': 'I won\'t tell you'}
        resp5 = c.post('/api/evaluate', json=data5)
        print("Input:", data5['response'])
        print(json.dumps(resp5.json, indent=2))

if __name__ == "__main__":
    run_tests()
