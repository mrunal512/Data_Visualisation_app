from datetime import datetime

def apply_filters(records, filters):
    def matches_all(record):
        for f in filters:
            filter_source = f.get("source")
            if filter_source and record.get("source") != filter_source:
                continue  # apply only filters relevant to the record's source

            field = f["field"]
            operator = f["operator"]
            value = f["value"]
            record_val = record.get(field)

            if record_val is None:
                return False

            try:
                if field == "date":
                    record_val = datetime.strptime(record_val, "%Y-%m-%d")
                    if operator == "between":
                        start, end = value.split(",")
                        if not (datetime.strptime(start.strip(), "%Y-%m-%d") <= record_val <= datetime.strptime(end.strip(), "%Y-%m-%d")):
                            return False
                    elif operator == ">":
                        if not record_val > datetime.strptime(value.strip(), "%Y-%m-%d"):
                            return False
                    elif operator == "<":
                        if not record_val < datetime.strptime(value.strip(), "%Y-%m-%d"):
                            return False
                elif isinstance(record_val, (int, float)) or field == "price":
                    record_val = float(record_val)
                    if operator == "=":
                        if not record_val == float(value):
                            return False
                    elif operator == ">":
                        if not record_val > float(value):
                            return False
                    elif operator == "<":
                        if not record_val < float(value):
                            return False
                    elif operator == "between":
                        start, end = value.split(",")
                        if not (float(start.strip()) <= record_val <= float(end.strip())):
                            return False
                    elif operator == "in":
                        if not record_val in [float(v.strip()) for v in value.split(",")]:
                            return False
                else:
                    record_val = str(record_val).strip().lower()
                    if operator == "in":
                        if record_val not in [v.strip().lower() for v in value.split(",")]:
                            return False
                    elif operator == "not in":
                        if record_val in [v.strip().lower() for v in value.split(",")]:
                            return False
                    elif operator == "=":
                        if record_val != value.strip().lower():
                            return False
            except Exception as e:
                print(f"Filter error: {e}")
                return False

        return True

    return [record for record in records if matches_all(record)]
