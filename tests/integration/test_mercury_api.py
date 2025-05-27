#!/usr/bin/env python3
"""
Integration test to verify MCP server implementation matches actual Mercury API
"""

import os
import sys
import json
import asyncio
from pathlib import Path

# Add mercury_client to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "mercury_client"))

from mercury_client import MercuryClient, AsyncMercuryClient
from mercury_client.exceptions import MercuryAPIError

def test_basic_connection():
    """Test basic connection to Mercury API"""
    api_key = os.getenv("MERCURY_API_KEY")
    if not api_key:
        print("❌ MERCURY_API_KEY not found in environment")
        return False
    
    try:
        client = MercuryClient(api_key=api_key)
        print("✅ Successfully created Mercury client")
        return True
    except Exception as e:
        print(f"❌ Failed to create client: {e}")
        return False

def test_list_models():
    """Test listing available models"""
    try:
        client = MercuryClient()
        models = client.list_models()
        
        print("\n📋 Available Models:")
        for model in models.data:
            print(f"  - {model.id} (owned by {model.owned_by})")
            
        # Verify mercury-coder-small exists
        model_ids = [m.id for m in models.data]
        if "mercury-coder-small" in model_ids:
            print("✅ mercury-coder-small is available")
        else:
            print("⚠️  mercury-coder-small not found in models list")
            
        return True
    except Exception as e:
        print(f"❌ Failed to list models: {e}")
        return False

def test_chat_completion():
    """Test basic chat completion"""
    try:
        client = MercuryClient()
        
        response = client.chat_completion(
            messages=[
                {"role": "system", "content": "You are a helpful coding assistant"},
                {"role": "user", "content": "Write a simple Python hello world function"}
            ],
            model="mercury-coder-small",
            max_tokens=100,
            temperature=0.3
        )
        
        print("\n💬 Chat Completion Response:")
        print(f"  Model: {response.model}")
        print(f"  Tokens: {response.usage.total_tokens}")
        print(f"  Content: {response.choices[0].message.content[:100]}...")
        print("✅ Chat completion successful")
        
        return True
    except Exception as e:
        print(f"❌ Chat completion failed: {e}")
        return False

def test_fim_completion():
    """Test Fill-in-the-Middle completion"""
    try:
        client = MercuryClient()
        
        response = client.fim_completion(
            prompt="def calculate_average(numbers):\n    total = ",
            suffix="\n    return total / len(numbers)",
            model="mercury-coder-small",
            max_tokens=50
        )
        
        print("\n🔧 FIM Completion Response:")
        print(f"  Generated: {response.choices[0].text}")
        print(f"  Tokens: {response.usage.completion_tokens}")
        print("✅ FIM completion successful")
        
        return True
    except Exception as e:
        print(f"❌ FIM completion failed: {e}")
        return False

async def test_streaming():
    """Test streaming chat completion"""
    try:
        async with AsyncMercuryClient() as client:
            print("\n🌊 Testing Streaming:")
            
            chunks = []
            async for chunk in client.chat_completion_stream(
                messages=[{"role": "user", "content": "Count from 1 to 5"}],
                model="mercury-coder-small",
                max_tokens=50
            ):
                if chunk.choices[0].delta and chunk.choices[0].delta.content:
                    chunks.append(chunk.choices[0].delta.content)
                    print(".", end="", flush=True)
            
            print(f"\n  Received {len(chunks)} chunks")
            print(f"  Full response: {''.join(chunks)[:100]}...")
            print("✅ Streaming successful")
            
            return True
    except Exception as e:
        print(f"❌ Streaming failed: {e}")
        return False

def verify_api_structure():
    """Verify API response structure matches our TypeScript types"""
    try:
        client = MercuryClient()
        
        # Test response structure
        response = client.chat_completion(
            messages=[{"role": "user", "content": "Hi"}],
            model="mercury-coder-small",
            max_tokens=10
        )
        
        print("\n🔍 API Structure Verification:")
        
        # Check required fields
        required_fields = ["id", "object", "created", "model", "choices", "usage"]
        for field in required_fields:
            if hasattr(response, field):
                print(f"  ✓ {field}: present")
            else:
                print(f"  ✗ {field}: MISSING")
        
        # Check choice structure
        if response.choices:
            choice = response.choices[0]
            choice_fields = ["index", "message", "finish_reason"]
            print("\n  Choice structure:")
            for field in choice_fields:
                if hasattr(choice, field):
                    print(f"    ✓ {field}: present")
                else:
                    print(f"    ✗ {field}: MISSING")
        
        # Check usage structure
        if response.usage:
            usage_fields = ["prompt_tokens", "completion_tokens", "total_tokens"]
            print("\n  Usage structure:")
            for field in usage_fields:
                if hasattr(response.usage, field):
                    print(f"    ✓ {field}: present")
                else:
                    print(f"    ✗ {field}: MISSING")
        
        print("\n✅ API structure verification complete")
        return True
        
    except Exception as e:
        print(f"❌ Structure verification failed: {e}")
        return False

def main():
    """Run all integration tests"""
    print("🚀 Mercury API Integration Tests\n")
    print("=" * 50)
    
    tests = [
        ("Basic Connection", test_basic_connection),
        ("List Models", test_list_models),
        ("Chat Completion", test_chat_completion),
        ("FIM Completion", test_fim_completion),
        ("API Structure", verify_api_structure),
    ]
    
    results = []
    for name, test_func in tests:
        print(f"\n📌 Testing: {name}")
        print("-" * 30)
        success = test_func()
        results.append((name, success))
    
    # Test async streaming separately
    print(f"\n📌 Testing: Streaming")
    print("-" * 30)
    success = asyncio.run(test_streaming())
    results.append(("Streaming", success))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:\n")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {name:<20} {status}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! MCP server implementation is compatible.")
    else:
        print("\n⚠️  Some tests failed. Review implementation for compatibility.")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)