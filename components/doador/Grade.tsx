import React from 'react';
import { View, DimensionValue } from 'react-native';

/** Distribui os filhos em `colunas` colunas de largura igual (1 = lista). */
export function Grade({ colunas, children }: { colunas: number; children: React.ReactNode }) {
  const itens = React.Children.toArray(children);
  const largura = `${100 / colunas}%` as DimensionValue;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
      {itens.map((filho, i) => (
        <View key={i} style={{ width: largura, padding: 6 }}>
          {filho}
        </View>
      ))}
    </View>
  );
}
