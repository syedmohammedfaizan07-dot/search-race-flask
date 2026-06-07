from flask import Flask, jsonify, render_template, request
import random
import time

app = Flask(__name__)


# ---------- Algorithms ----------

def linear_search(arr, target):
    steps = 0
    start = time.perf_counter()
    found = -1
    for i, v in enumerate(arr):
        steps += 1
        if v == target:
            found = i
            break
    return {"result": found, "steps": steps, "timeMs": (time.perf_counter() - start) * 1000}


def binary_search(arr, target):
    steps = 0
    start = time.perf_counter()
    lo, hi, found = 0, len(arr) - 1, -1
    while lo <= hi:
        steps += 1
        mid = (lo + hi) // 2
        if arr[mid] == target:
            found = mid
            break
        elif arr[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return {"result": found, "steps": steps, "timeMs": (time.perf_counter() - start) * 1000}


def bubble_sort(arr):
    a = list(arr)
    steps = 0
    start = time.perf_counter()
    n = len(a)
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1 - i):
            steps += 1
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
        if not swapped:
            break
    return {"result": a, "steps": steps, "timeMs": (time.perf_counter() - start) * 1000}


def merge_sort(arr):
    steps = [0]
    start = time.perf_counter()

    def merge(left, right):
        out, i, j = [], 0, 0
        while i < len(left) and j < len(right):
            steps[0] += 1
            if left[i] <= right[j]:
                out.append(left[i]); i += 1
            else:
                out.append(right[j]); j += 1
        out.extend(left[i:])
        out.extend(right[j:])
        return out

    def sort(a):
        if len(a) <= 1:
            return a
        mid = len(a) // 2
        return merge(sort(a[:mid]), sort(a[mid:]))

    result = sort(list(arr))
    return {"result": result, "steps": steps[0], "timeMs": (time.perf_counter() - start) * 1000}


def list_membership(arr, target):
    steps = 0
    start = time.perf_counter()
    found = False
    for v in arr:
        steps += 1
        if v == target:
            found = True
            break
    return {"result": found, "steps": steps, "timeMs": (time.perf_counter() - start) * 1000}


def set_membership(s, target):
    start = time.perf_counter()
    found = target in s
    return {"result": found, "steps": 1, "timeMs": (time.perf_counter() - start) * 1000}


# ---------- Routes ----------

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/run", methods=["POST"])
def run():
    data = request.get_json(force=True)
    mode = data.get("mode", "search")
    size = int(data.get("size", 10000))
    size = max(10, min(size, 200000))

    if mode == "search":
        arr = sorted(random.randint(0, size * 4) for _ in range(size))
        target = random.choice(arr)
        a = linear_search(arr, target)
        b = binary_search(arr, target)
        return jsonify({
            "mode": mode, "size": size,
            "a": {"name": "Linear Search", "complexity": "O(n)", **a},
            "b": {"name": "Binary Search", "complexity": "O(log n)", **b},
        })

    if mode == "sort":
        size = min(size, 5000)  # bubble sort guard
        arr = [random.randint(0, size * 4) for _ in range(size)]
        a = bubble_sort(arr)
        b = merge_sort(arr)
        return jsonify({
            "mode": mode, "size": size,
            "a": {"name": "Bubble Sort", "complexity": "O(n²)",
                  "steps": a["steps"], "timeMs": a["timeMs"], "result": "sorted"},
            "b": {"name": "Merge Sort", "complexity": "O(n log n)",
                  "steps": b["steps"], "timeMs": b["timeMs"], "result": "sorted"},
        })

    if mode == "membership":
        arr = [random.randint(0, size * 4) for _ in range(size)]
        s = set(arr)
        target = random.choice(arr)
        a = list_membership(arr, target)
        b = set_membership(s, target)
        return jsonify({
            "mode": mode, "size": size,
            "a": {"name": "List Membership", "complexity": "O(n)", **a},
            "b": {"name": "Set Membership", "complexity": "O(1)", **b},
        })

    return jsonify({"error": "unknown mode"}), 400

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
