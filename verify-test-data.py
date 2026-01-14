import psycopg2
import os
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv('/xampp/htdocs/fitgenius-ai/server/.env')

DATABASE_URL = os.getenv('DATABASE_URL')

try:
    print("\n📊 VERIFICANDO DATOS EN NEON\n")
    print("=" * 50)
    
    # Conectar a Neon
    conn = psycopg2.connect(DATABASE_URL, sslmode='require')
    cursor = conn.cursor()
    
    # Contar miembros
    cursor.execute("SELECT COUNT(*) FROM gym_members")
    member_count = cursor.fetchone()[0]
    print(f"✅ Total de miembros: {member_count}")
    
    # Mostrar miembros
    print("\n👥 Miembros guardados en Neon:\n")
    cursor.execute("""
        SELECT name, plan, status, last_payment_amount, created_at 
        FROM gym_members 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    
    for row in cursor.fetchall():
        name, plan, status, payment, created = row
        print(f"  • {name}")
        print(f"    Plan: {plan} | Estado: {status} | Pago: ${payment}")
        print(f"    Creado: {created}")
        print()
    
    print("=" * 50)
    print("✨ DATOS GUARDADOS EXITOSAMENTE EN NEON")
    print("🔍 Verifica en: https://console.neon.tech")
    print("=" * 50)
    print()
    
    cursor.close()
    conn.close()

except Exception as e:
    print(f"❌ Error: {str(e)}")
