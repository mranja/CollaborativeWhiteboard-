import React, { useState, useEffect } from 'react'
import { boardAPI } from '../api/client'

export default function VersionHistoryModal({ boardId, onClose }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await boardAPI.getVersions(boardId)
        setVersions(res.data)
      } catch (err) {
        console.error('Failed to fetch versions:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchVersions()
  }, [boardId])

  const handleRestore = (versionNumber) => {
    console.log('Restore version:', versionNumber)
    // TODO: Implement restore logic
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-auto p-6">
        <h2 className="text-xl font-bold mb-4">Version History</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No versions saved yet</div>
        ) : (
          <div className="space-y-2">
            {versions.map((v) => (
              <div key={v._id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <div>
                  <p className="font-medium">Version {v.versionNumber}</p>
                  <p className="text-sm text-gray-500">{new Date(v.createdAt).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => handleRestore(v.versionNumber)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
