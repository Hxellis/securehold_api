import sys
import json

def test1():
    return "Hello from Python"

def test2():
    return "Another function result"


if __name__ == "__main__":
    functionName = sys.argv[1] if len(sys.argv) > 1 else None

    match functionName:
        case "test1":
            result = test1()
        case "test2":
            result = test2()
        case _:
            result = "Invalid function name"

    print(json.dumps(result))
    sys.stdout.flush()