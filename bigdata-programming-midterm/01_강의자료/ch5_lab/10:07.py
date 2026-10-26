from pathlib import Path

count = 0
with open(Path(__file__).with_name("phones.txt"),
    encoding="utf-8") as f:
    for line in f:
        count += 1
print(count, "명")
print("인원:", count)