#!/usr/bin/env node
/**
 * Script de prueba de conexión a MySQL
 * Ejecutar: node scripts/test-db.js
 */

import dotenv from 'dotenv';
import { query } from '../src/config/database.js';

dotenv.config();

console.log('🔍 Probando conexión a MySQL...\n');

try {
  // Test 1: Verificar conexión básica
  console.log('1️⃣  Probando conexión básica...');
  const result = await query('SELECT 1 as test');
  console.log('   ✅ Conexión exitosa:', result[0].test === 1 ? 'OK' : 'FALLÓ');

  // Test 2: Verificar que existen las tablas principales
  console.log('\n2️⃣  Verificando tablas existentes...');
  const tables = await query(`
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = ?
  `, [process.env.DB_NAME || 'sensorial_db']);
  
  const tableNames = tables.map(t => t.TABLE_NAME);
  console.log('   📋 Tablas encontradas:', tableNames.join(', ') || 'NINGUNA');

  // Test 3: Verificar tabla usuarios
  if (tableNames.includes('usuarios')) {
    console.log('\n3️⃣  Verificando tabla usuarios...');
    const [usuarioTest] = await query('SELECT COUNT(*) as count FROM usuarios');
    console.log('   👥 Total de usuarios:', usuarioTest.count);
  }

  // Test 4: Verificar variables de entorno críticas
  console.log('\n4️⃣  Verificando variables de entorno...');
  const envVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET', 'STRIPE_SECRET_KEY', 'RESEND_API_KEY'];
  envVars.forEach(varName => {
    const value = process.env[varName];
    const status = value ? '✅' : '❌';
    const display = value ? (varName.includes('SECRET') || varName.includes('KEY') ? '********' : value) : 'NO CONFIGURADO';
    console.log(`   ${status} ${varName}: ${display}`);
  });

  console.log('\n✅ Todos los tests completados exitosamente!');
  console.log('\n🚀 El servidor está listo para iniciar con:');
  console.log('   npm run dev');
  
  process.exit(0);
} catch (error) {
  console.error('\n❌ Error de conexión a MySQL:');
  console.error('   ', error.message);
  console.error('\n🔧 Posibles soluciones:');
  console.error('   1. Verifica que MySQL esté corriendo (XAMPP/WAMP/MAMP)');
  console.error('   2. Revisa las credenciales en el archivo .env');
  console.error('   3. Asegúrate de que la base de datos exista');
  process.exit(1);
}
