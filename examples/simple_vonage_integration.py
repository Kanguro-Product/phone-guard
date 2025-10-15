"""
Simple Vonage A/B Caller Integration - Python Version

Ejemplo de integración simple con N8N webhook para llamadas A/B.
Solo maneja login inicial y llamada al webhook de N8N.
"""

import requests
import json
from datetime import datetime
from typing import Dict, List, Optional, Union

class SimpleVonageABCaller:
    def __init__(self, n8n_webhook_url: str, api_key: str):
        self.n8n_webhook_url = n8n_webhook_url
        self.api_key = api_key

    def login(self) -> Dict[str, Union[bool, str]]:
        """
        Hacer login inicial para autenticación
        """
        try:
            response = requests.post(
                f"{self.n8n_webhook_url}/login",
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.api_key}'
                },
                json={
                    'action': 'login',
                    'timestamp': datetime.now().isoformat()
                }
            )

            if not response.ok:
                raise Exception(f"Login failed: {response.status_text}")

            result = response.json()
            return {'success': result.get('success', True)}

        except Exception as error:
            return {
                'success': False,
                'error': str(error)
            }

    def make_ab_call(self, destination_number: str, derivation_id: str, 
                    origin_number: str, group: str, test_id: Optional[str] = None, 
                    lead_id: Optional[str] = None) -> Dict:
        """
        Hacer llamada A/B usando webhook de N8N
        """
        try:
            # 1. Login inicial
            login_result = self.login()
            if not login_result['success']:
                return {
                    'success': False,
                    'error': f"Login failed: {login_result.get('error')}"
                }

            # 2. Construir payload para N8N
            n8n_payload = {
                'destinationNumber': destination_number,
                'derivationId': derivation_id,
                'originNumber': origin_number,
                'group': group,
                'testId': test_id,
                'leadId': lead_id,
                'timestamp': datetime.now().isoformat()
            }

            # 3. Llamar al webhook de N8N
            response = requests.post(
                self.n8n_webhook_url,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.api_key}'
                },
                json=n8n_payload
            )

            if not response.ok:
                raise Exception(f"N8N webhook failed: {response.status_text}")

            result = response.json()

            return {
                'success': result.get('success', True),
                'callId': result.get('callId'),
                'metadata': {
                    'group': group,
                    'derivationId': derivation_id,
                    'destinationNumber': destination_number,
                    'originNumber': origin_number,
                    'timestamp': datetime.now().isoformat()
                }
            }

        except Exception as error:
            return {
                'success': False,
                'error': str(error)
            }

    def make_batch_ab_calls(self, requests: List[Dict]) -> List[Dict]:
        """
        Hacer múltiples llamadas A/B (batch)
        """
        # Login inicial una sola vez
        login_result = self.login()
        if not login_result['success']:
            return [{
                'success': False,
                'error': f"Login failed: {login_result.get('error')}"
            }] * len(requests)

        # Procesar llamadas en paralelo
        results = []
        for request in requests:
            result = self.make_ab_call(
                destination_number=request['destinationNumber'],
                derivation_id=request['derivationId'],
                origin_number=request['originNumber'],
                group=request['group'],
                test_id=request.get('testId'),
                lead_id=request.get('leadId')
            )
            results.append(result)

        return results

# Ejemplo de uso
async def ejemplo_uso():
    # Configuración
    n8n_webhook_url = 'https://n8n.test.kanguro.com/webhook/ab-test-call'
    api_key = 'tu_api_key_aqui'

    # Crear instancia
    caller = SimpleVonageABCaller(n8n_webhook_url, api_key)

    # Ejemplo 1: Llamada individual A/B
    resultado_individual = caller.make_ab_call(
        destination_number='34661216995',
        derivation_id='mobile-derivation-001',  # Para Group A (mobile)
        origin_number='34604579589',
        group='A',
        test_id='test_123',
        lead_id='lead_456'
    )

    print('Resultado individual:', resultado_individual)

    # Ejemplo 2: Llamadas batch A/B
    requests = [
        {
            'destinationNumber': '34661216995',
            'derivationId': 'mobile-derivation-001',  # Group A
            'originNumber': '34604579589',
            'group': 'A',
            'testId': 'test_123',
            'leadId': 'lead_456'
        },
        {
            'destinationNumber': '34661216995',
            'derivationId': 'landline-derivation-002',  # Group B
            'originNumber': '34604579589',
            'group': 'B',
            'testId': 'test_123',
            'leadId': 'lead_456'
        }
    ]

    resultados_batch = caller.make_batch_ab_calls(requests)
    print('Resultados batch:', resultados_batch)

# Ejemplo de configuración A/B
configuraciones_ab = {
    'groupA': {
        'derivationId': 'mobile-derivation-001',
        'originNumber': '34604579589',
        'strategy': 'mobile-first'
    },
    'groupB': {
        'derivationId': 'landline-derivation-002',
        'originNumber': '34604579589',
        'strategy': 'landline-focused'
    }
}

# Función para hacer llamada A/B parametrizada
def llamada_ab_parametrizada(destination_number: str, group: str, 
                           test_id: str, lead_id: str) -> Dict:
    caller = SimpleVonageABCaller(
        'https://n8n.test.kanguro.com/webhook/ab-test-call',
        'tu_api_key_aqui'
    )

    config = configuraciones_ab[f'group{group}']

    return caller.make_ab_call(
        destination_number=destination_number,
        derivation_id=config['derivationId'],
        origin_number=config['originNumber'],
        group=group,
        test_id=test_id,
        lead_id=lead_id
    )

# Ejemplo de integración con Flask
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/ab-call', methods=['POST'])
def ab_call_endpoint():
    try:
        data = request.json
        
        # Validar datos requeridos
        required_fields = ['destinationNumber', 'group', 'testId', 'leadId']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400

        # Hacer llamada A/B
        result = llamada_ab_parametrizada(
            destination_number=data['destinationNumber'],
            group=data['group'],
            test_id=data['testId'],
            lead_id=data['leadId']
        )

        return jsonify(result)

    except Exception as error:
        return jsonify({'error': str(error)}), 500

if __name__ == '__main__':
    # Ejecutar ejemplo
    ejemplo_uso()
