total = 0
count = 0
with open("scores.txt",
    encoding="utf-8") as f:
    for line in f:
        total += float(line)
        count += 1
average = total / count if count > 0 else 0
with open("summary.txt", "w", encoding="utf-8") as f:
    f.write(f"count={count}\naverage={average:.1f}\n")
print(count, average)