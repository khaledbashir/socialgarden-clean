#!/usr/bin/env python3
"""
Financial Data Extraction - Correct Version
Purpose: Extract pricing totals by SUMMING all rows except the final total row
Status: Production-ready

Key insight: The TOTAL row sometimes has incorrect rate values or is just a label.
Solution: Sum all non-total rows OR use the hours value from the total row directly.
"""

import json
import subprocess
import os
from typing import Optional
from decimal import Decimal

def get_sow_content(sow_id: str) -> Optional[str]:
    """Fetch SOW content from Docker MySQL container"""
    try:
        # Use shell string to properly handle password with special characters
        shell_cmd = f"docker exec ahmad_mysql-database.1.r460oc4y85bii82muxefe8rpi mysql -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -N -e \"SELECT content FROM sows WHERE id = '{sow_id}';\" 2>/dev/null"
        result = subprocess.run(shell_cmd, capture_output=True, timeout=10, shell=True)
        
        # Handle encoding manually - decode with replacement for invalid bytes
        try:
            content = result.stdout.decode('utf-8', errors='replace').strip()
        except:
            content = result.stdout.decode('latin-1', errors='replace').strip()
        
        return content if content else None
    except Exception as e:
        print(f"  ⚠️  Failed to fetch: {e}")
        return None

def extract_pricing_total(content_str: str) -> Optional[int]:
    """
    Parse TipTap JSON and extract the total investment.
    
    Strategy:
    1. Find editablePricingTable node
    2. Get all rows
    3. Either:
       a) Sum hours × rate for all non-total rows
       b) Use the hours value from the total row if it's clearly the amount
    """
    try:
        content = json.loads(content_str)
    except json.JSONDecodeError:
        return None
    
    if not isinstance(content, dict) or 'content' not in content:
        return None
    
    # Find pricing table
    for node in content.get('content', []):
        if node.get('type') != 'editablePricingTable':
            continue
            
        rows = node.get('attrs', {}).get('rows', [])
        if not rows:
            continue
        
        # Try to find the total row (last row with "Total" in role)
        total_row_index = -1
        for i in range(len(rows) - 1, -1, -1):
            role = rows[i].get('role', '')
            if 'Total' in role or 'TOTAL' in role or 'Subtotal' in role:
                total_row_index = i
                break
        
        # Calculate the total
        if total_row_index >= 0:
            # Sum all rows EXCEPT the total row
            total = 0
            for i, row in enumerate(rows):
                if i == total_row_index:
                    continue  # Skip the total row itself
                
                hours = row.get('hours', 0)
                rate = row.get('rate', 0)
                total += hours * rate
            
            return int(total) if total > 0 else None
        else:
            # No total row found, sum all rows
            total = 0
            for row in rows:
                hours = row.get('hours', 0)
                rate = row.get('rate', 0)
                if rate > 0:  # Skip any totals or invalid rows
                    total += hours * rate
            
            return int(total) if total > 0 else None
    
    return None

def update_sow(sow_id: str, amount: int):
    """Update SOW in Docker MySQL container"""
    try:
        shell_cmd = f"docker exec ahmad_mysql-database.1.r460oc4y85bii82muxefe8rpi mysql -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -e \"UPDATE sows SET total_investment = {amount} WHERE id = '{sow_id}';\" 2>/dev/null"
        result = subprocess.run(shell_cmd, capture_output=True, timeout=10, shell=True)
        return result.returncode == 0
    except Exception as e:
        print(f"  ⚠️  Failed to update: {e}")
        return False

def get_unpopulated_sows():
    """Get list of SOWs with pricing tables and zero investment"""
    try:
        shell_cmd = "docker exec ahmad_mysql-database.1.r460oc4y85bii82muxefe8rpi mysql -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -N -e \"SELECT id, title FROM sows WHERE content LIKE '%editablePricingTable%' AND total_investment = 0;\" 2>/dev/null"
        result = subprocess.run(shell_cmd, capture_output=True, text=True, timeout=10, shell=True, errors='replace')
        
        sows = []
        for line in result.stdout.strip().split('\n'):
            if line.strip():
                parts = line.split('\t', 1)
                if len(parts) == 2:
                    sows.append((parts[0].strip(), parts[1].strip()))
        return sows
    except Exception as e:
        print(f"Failed to fetch SOWs: {e}")
        return []

def main():
    print("=" * 80)
    print("🔄 Financial Data Migration - Corrected Extraction")
    print("=" * 80)
    print()
    
    # Get list of SOWs to process
    sows = get_unpopulated_sows()
    print(f"📊 Found {len(sows)} SOWs with pricing tables to process\n")
    
    if not sows:
        print("✅ No SOWs with zero investment and pricing tables found.")
        return
    
    success_count = 0
    total_extracted = 0
    
    for i, (sow_id, title) in enumerate(sows, 1):
        print(f"[{i}/{len(sows)}] {title[:60]}")
        
        # Fetch content
        content = get_sow_content(sow_id)
        if not content:
            print(f"  ⚠️  Could not fetch content")
            continue
        
        # Extract total
        amount = extract_pricing_total(content)
        if not amount or amount <= 0:
            print(f"  ⚠️  No valid pricing found")
            continue
        
        # Update database
        if update_sow(sow_id, amount):
            print(f"  ✅ Updated: ${amount:,}")
            success_count += 1
            total_extracted += amount
        else:
            print(f"  ❌ Failed to update database")
    
    print()
    print("=" * 80)
    print("✅ MIGRATION COMPLETE")
    print("=" * 80)
    print()
    print(f"📊 Results:")
    print(f"   Processed:       {success_count}/{len(sows)}")
    print(f"   Total Extracted: ${total_extracted:,.0f}")
    print()
    
    # Show final state
    try:
        shell_cmd = "docker exec ahmad_mysql-database.1.r460oc4y85bii82muxefe8rpi mysql -u sg_sow_user -p'SG_sow_2025_SecurePass!' socialgarden_sow -N -e \"SELECT COUNT(*), SUM(total_investment) FROM sows WHERE total_investment > 0;\" 2>/dev/null"
        result = subprocess.run(shell_cmd, capture_output=True, text=True, timeout=10, shell=True)
        parts = result.stdout.strip().split('\t')
        if len(parts) == 2:
            count = parts[0]
            total = parts[1]
            print(f"📈 Final Dashboard Summary:")
            print(f"   SOWs with values: {count}")
            print(f"   Total Investment: ${int(float(total)):,} AUD")
    except:
        pass
    
    print()

if __name__ == '__main__':
    main()
