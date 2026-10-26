with open("hours.txt", encoding="utf-8") as f:
    for line in f:
        fields = line.split()
        name = fields[1]
        total = 0.0
        for text in fields[2:]:
            total += float(text)
        print(name, f"{total:.1f}")