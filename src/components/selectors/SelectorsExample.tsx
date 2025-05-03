import React, { useState } from 'react';
import { EnvironmentSelector } from './EnvironmentSelector';
import { TeamSelector } from './TeamSelector';

const SelectorsExample: React.FC = () => {
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  return (
    <div className="p-6 space-y-6 bg-gray-50 rounded-md">
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Demonstração dos Seletores Dinâmicos</h2>
        <p className="text-sm text-gray-500">
          Estes seletores buscam dados diretamente da API GraphQL e podem ser usados em formulários e filtros.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="environment-selector" className="text-sm font-medium">
            Ambiente Selecionado
          </label>
          <EnvironmentSelector
            value={selectedEnvironment}
            onChange={setSelectedEnvironment}
            placeholder="Selecione um ambiente"
          />
          {selectedEnvironment && (
            <p className="text-sm text-gray-500">
              ID do ambiente selecionado: {selectedEnvironment}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="team-selector" className="text-sm font-medium">
            Time Selecionado
          </label>
          <TeamSelector
            value={selectedTeam}
            onChange={setSelectedTeam}
            placeholder="Selecione um time"
          />
          {selectedTeam && (
            <p className="text-sm text-gray-500">
              ID do time selecionado: {selectedTeam}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 border rounded-md bg-white">
        <h3 className="text-sm font-medium mb-2">Estado atual:</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
          {JSON.stringify(
            {
              selectedEnvironment,
              selectedTeam,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
};

export default SelectorsExample; 