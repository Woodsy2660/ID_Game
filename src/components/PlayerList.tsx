import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'

interface Player {
  player_id: string
  display_name: string
}

interface PlayerListProps {
  players: Player[]
  currentPlayerId: string
  hostId?: string
}

export function PlayerList({ players, currentPlayerId, hostId }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Waiting for players to join...</Text>
      </View>
    )
  }

  return (
    <View>
      <Text style={styles.count}>{players.length} player{players.length !== 1 ? 's' : ''}</Text>
      <ScrollView style={styles.list}>
        {players.map((player) => (
          <View key={player.player_id} style={styles.row}>
            <Text style={[styles.name, player.player_id === currentPlayerId && styles.self]}>
              {player.display_name}
              {player.player_id === currentPlayerId ? ' (you)' : ''}
            </Text>
            {player.player_id === hostId && <Text style={styles.hostBadge}>host</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 15,
  },
  count: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  list: {
    maxHeight: 300,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  name: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  self: {
    fontWeight: '600',
    color: '#4F46E5',
  },
  hostBadge: {
    fontSize: 12,
    color: '#4F46E5',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
})
