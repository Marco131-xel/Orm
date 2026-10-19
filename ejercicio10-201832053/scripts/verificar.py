#!/usr/bin/env python3
"""Pruebas HTTP con curl y evidencia SQL. Ejecutar con la API encendida."""
import json
import os
from pathlib import Path
import subprocess
import time
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
BASE = 'http://localhost:3053'
config = dict(line.split('=', 1) for line in (ROOT / '.env').read_text().splitlines()
              if line and not line.startswith('#'))
env = os.environ.copy()
for key, pg in [('DB_HOST', 'PGHOST'), ('DB_PORT', 'PGPORT'),
                ('DB_USERNAME', 'PGUSER'), ('DB_PASSWORD', 'PGPASSWORD'),
                ('DB_DATABASE', 'PGDATABASE')]:
    env[pg] = config[key]
report = []


def sql(query):
    return subprocess.check_output(['psql', '-X', '-w', '-v', 'ON_ERROR_STOP=1', '-Atc', query],
                                   env=env, text=True).strip()


def request(method, route, expected, body=None):
    cmd = ['curl', '--silent', '--show-error', '--max-time', '15', '-X', method,
           BASE + route, '-w', '\n%{http_code}']
    if body is not None:
        cmd += ['-H', 'Content-Type: application/json', '--data', json.dumps(body)]
    raw = subprocess.check_output(cmd, text=True)
    data, status = raw.rsplit('\n', 1)
    result = json.loads(data)
    report.append({'method': method, 'url': BASE + route, 'status': int(status), 'response': result})
    assert int(status) == expected, (method, route, status, data)
    print(f'{method} {BASE}{route} -> {status}')
    return result


def snapshot(cita_id):
    query = f'SELECT row_to_json(c) FROM cita c WHERE id_cita = {int(cita_id)};'
    value = json.loads(sql(query))
    report.append({'sql': query, 'result': value})
    return value


created = None
original = None
try:
    patients = request('GET', '/pacientes', 200)
    assert len(patients) >= 3
    first = patients[0]['id_paciente']
    request('GET', f'/pacientes/{first}', 200)
    missing = int(sql('SELECT coalesce(max(id_paciente), 0) + 10000 FROM paciente;'))
    request('GET', f'/pacientes/{missing}', 404)
    request('DELETE', f'/pacientes/{missing}', 404)
    request('PATCH', f'/pacientes/{missing}', 404, {'nombre': 'Ausente'})
    request('GET', '/pacientes/abc', 400)
    body = {'nombre': 'Prueba ejercicio 10', 'apellido': 'Temporal',
            'fecha_nacimiento': '2000-01-01', 'telefono': '5555-9999',
            'correo': f'ejercicio10.{time.time_ns()}@example.com'}
    new = request('POST', '/pacientes', 201, {**body, 'ignorado': 'whitelist'})
    created = new['id_paciente']
    assert 'ignorado' not in new
    request('POST', '/pacientes', 409, body)
    request('POST', '/pacientes', 400, {'nombre': 'Incompleto'})
    request('POST', '/pacientes', 400, {**body, 'fecha_nacimiento': '2000-02-30'})
    updated = request('PATCH', f'/pacientes/{created}', 200, {'nombre': 'Nombre actualizado'})
    assert updated['nombre'] == 'Nombre actualizado'
    request('PATCH', f'/pacientes/{created}', 400, {'nombre': None})
    nullable = request('PATCH', f'/pacientes/{created}', 200, {'telefono': None, 'correo': None})
    assert nullable['telefono'] is None and nullable['correo'] is None
    request('DELETE', f'/pacientes/{created}', 200)
    request('GET', f'/pacientes/{created}', 404)
    created = None
    citas = request('GET', '/citas/con-relaciones', 200)
    assert citas and all('paciente' in c and 'medico' in c for c in citas)
    request('DELETE', f"/pacientes/{citas[0]['paciente']['id_paciente']}", 409)
    filtered = request('GET', '/citas/buscar?estado=Programada', 200)
    assert all(c['estado'] == 'Programada' for c in filtered)
    assert [(c['fecha'], c['hora']) for c in filtered] == sorted((c['fecha'], c['hora']) for c in filtered)
    assert len(filtered) == int(sql("SELECT count(*) FROM cita WHERE estado = 'Programada';"))
    assert request('GET', '/citas/buscar?' + urlencode({'estado': "' OR 1=1 --"}), 200) == []
    request('GET', '/citas/buscar', 400)
    cita_id = citas[0]['id_cita']
    original = snapshot(cita_id)
    request('POST', '/citas/transaccion', 400,
            {'id_cita': cita_id, 'motivo': 'ESTE MOTIVO DEBE REVERTIRSE', 'estado': 'Inventado'})
    after = snapshot(cita_id)
    assert after == original, 'El ROLLBACK no conservó la fila original'
    report.append({'rollback_demostrado': True, 'antes': original, 'despues': after})
    success_state = 'Confirmada' if original['estado'] != 'Confirmada' else 'Programada'
    request('POST', '/citas/transaccion', 200,
            {'id_cita': cita_id, 'motivo': 'Transacción exitosa ejercicio 10', 'estado': success_state})
    committed = snapshot(cita_id)
    assert committed['motivo'] == 'Transacción exitosa ejercicio 10' and committed['estado'] == success_state
    report.append({'commit_demostrado': True, 'fila': committed})
    absent_cita = int(sql('SELECT coalesce(max(id_cita), 0) + 10000 FROM cita;'))
    request('POST', '/citas/transaccion', 404,
            {'id_cita': absent_cita, 'motivo': 'No existe', 'estado': 'Programada'})
    request('POST', '/citas/transaccion', 400, {'id_cita': cita_id, 'estado': 'Programada'})
finally:
    if created is not None:
        request('DELETE', f'/pacientes/{created}', 200)
    if original is not None:
        request('POST', '/citas/transaccion', 200,
                {'id_cita': original['id_cita'], 'motivo': original['motivo'], 'estado': original['estado']})
        assert snapshot(original['id_cita']) == original
    (ROOT / 'evidencias').mkdir(exist_ok=True)
    (ROOT / 'evidencias' / 'verificacion.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print('Todas las verificaciones pasaron. Los datos de prueba fueron limpiados.')
