#!/usr/bin/env python3
"""
Financial Data Migration - Extract Pricing from SOWs
Purpose: Parse TipTap JSON content and extract pricing totals
Status: Production-ready CLI tool

Usage: python3 scripts/extract-pricing.py
"""

import json
import mysql.connector
import os
from typing import Optional, Tuple
from decimal import Decimal

# Database connection
def get_db_connection():
    # Get credentials from environment or use defaults
    host = os.getenv('DB_HOST', '168.231.115.219')
    user = os.getenv('DB_USER', 'sg_sow_user')
    password = os.getenv('DB_PASSWORD', 'SG_sow_2025_SecurePass!')
    database = os.getenv('DB_NAME', 'socialgarden_sow')
    
    print(f"   Connecting to {user}@{host}:{database}")
    
    return mysql.connector.connect(
        host=host,
        user=user,
        password=password,
        database=database,
        autocommit=True
    )

def extract_pricing_total(content_json_str: str) -> Optional[Decimal]:
    """
    Parse TipTap JSON and extract the total from editablePricingTable nodes.
    
    The TOTAL row is identified by:
    - rate = 0
    - role contains "Total" or similar
    - hours field contains the total amount
    """
    try:
        content = json.loads(content_json_str)
    except json.JSONDecodeError:
        return None
    
    if not isinstance(content, dict) or 'content' not in content:
        return None
    
    # Find editablePricingTable nodes
    for node in content.get('content', []):
        if node.get('type') == 'editablePricingTable':
            rows = node.get('attrs', {}).get('rows', [])
            
            # Find the TOTAL row (where rate = 0)
            for row in rows:
                if row.get('rate') == 0 and row.get('role'):
                    # The TOTAL row has the total amount in 'hours' field
                    total = row.get('hours', 0)
                    if total > 0:
                        return Decimal(str(total))
            
            # If no rate=0 found, return None (not a complete pricing table)
    
    return None

def main():
    print("=" * 80)
    print("🔄 Financial Data Migration - Pricing Extraction")
    print("=" * 80)
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get all SOWs with zero investment and pricing tables
        query_str = """
            SELECT id, title, content 
            FROM sows 
            WHERE total_investment = 0 
            AND content LIKE '%editablePricingTable%'
            ORDER BY created_at DESC
        """
        
        cursor.execute(query_str)
        sows = cursor.fetchall()
        
        print(f"\n📊 Found {len(sows)} SOWs with pricing tables to process\n")
        
        if not sows:
            print("✅ No SOWs with zero investment and pricing tables found.")
            cursor.close()
            conn.close()
            return
        
        success_count = 0
        total_extracted = Decimal('0')
        updates = []
        
        # Process each SOW
        for i, sow in enumerate(sows, 1):
            sow_id = sow['id']
            title = sow['title']
            content = sow['content']
            
            # Extract pricing total
            total = extract_pricing_total(content)
            
            if total and total > 0:
                print(f"✅ [{i}/{len(sows)}] {title}")
                print(f"   ID: {sow_id} | Total: ${float(total):,.2f} AUD")
                updates.append((float(total), sow_id))
                success_count += 1
                total_extracted += total
            else:
                print(f"⚠️  [{i}/{len(sows)}] {title} - No valid total found")
        
        # Execute batch update
        if updates:
            print(f"\n📝 Applying {len(updates)} updates to database...")
            for total, sow_id in updates:
                update_query = "UPDATE sows SET total_investment = %s WHERE id = %s"
                cursor.execute(update_query, (total, sow_id))
            
            conn.commit()
            print("✅ All updates applied successfully")
        
        # Verify results
        cursor.execute("""
            SELECT 
                COUNT(*) as total_sows,
                SUM(total_investment) as total_value,
                SUM(IF(total_investment > 0, 1, 0)) as sows_with_values,
                SUM(IF(total_investment = 0, 1, 0)) as sows_with_zero
            FROM sows
        """)
        
        result = cursor.fetchone()
        
        print("\n" + "=" * 80)
        print("✅ MIGRATION COMPLETE")
        print("=" * 80)
        print(f"\n📊 Migration Results:")
        print(f"   Processed:         {success_count}/{len(sows)}")
        print(f"   Total Extracted:   ${float(total_extracted):,.2f} AUD")
        
        print(f"\n📈 Final Dashboard Summary:")
        print(f"   Total SOWs:        {result['total_sows']}")
        print(f"   SOWs with values:  {result['sows_with_values']}")
        print(f"   SOWs with $0:      {result['sows_with_zero']}")
        print(f"   Total Investment:  ${float(result['total_value'] or 0):,.2f} AUD")
        
        # Show top SOWs
        print(f"\n🏆 Top 5 SOWs by Value:")
        cursor.execute("""
            SELECT title, total_investment, vertical, service_line
            FROM sows
            WHERE total_investment > 0
            ORDER BY total_investment DESC
            LIMIT 5
        """)
        
        for j, row in enumerate(cursor.fetchall(), 1):
            print(f"   {j}. {row['title']}: ${float(row['total_investment']):,.2f}")
        
        print("\n✨ Dashboard is now fully populated!\n")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"\n🔴 ERROR: {str(e)}")
        print("\nPlease verify:")
        print("  1. MySQL container is running")
        print("  2. Database credentials in environment variables")
        print("  3. python3-mysql connector installed: pip install mysql-connector-python")
        return 1
    
    return 0

if __name__ == '__main__':
    exit(main())
