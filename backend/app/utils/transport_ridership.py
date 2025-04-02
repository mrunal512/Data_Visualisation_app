# backend/app/utils/transport_ridership.py
import csv
import os

def load_transport_ridership():
    path = os.path.join(os.path.dirname(__file__), "transport_ridership.csv")
    with open(path, "r") as f:
        reader = csv.DictReader(f)
        return list(reader)
