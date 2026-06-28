import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DemandeChatModal from './DemandeChatModal';
import './DemandesPage.css';

const DemandesPage = ({ currentUser, onNavigate }) => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [showChat, setShowChat] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState(null);

  useEffect(() => {
    fetchDemandes();
    const interval = setInterval(fetchDemandes, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDemandes = async () => {
    try {
      const userId = currentUser._id || currentUser.id;
      const res = await axios.get('http://localhost:5000/api/demande');

      const userDemandes = res.data.filter(d =>
        d.proprietaireId === userId || d.demandeurId === userId
      );

      setDemandes(userDemandes);
    } catch (error) {
      console.error('Error fetching demandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (demandeId) => {
    if (!window.confirm('✅ Accepter cette demande?')) return;

    try {
      await axios.put(`http://localhost:5000/api/demande/${demandeId}/accept`);
      alert('✅ Demande acceptée! Vous pouvez maintenant discuter.');
      fetchDemandes();
    } catch (error) {
      alert('❌ Erreur: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (demandeId) => {
    if (!window.confirm('❌ Rejeter cette demande?')) return;

    try {
      await axios.put(`http://localhost:5000/api/demande/${demandeId}/reject`);
      alert('❌ Demande rejetée');
      fetchDemandes();
    } catch (error) {
      alert('❌ Erreur');
    }
  };

  const handleOpenChat = (demande) => {
    setSelectedDemande(demande);
    setShowChat(true);
  };

  const filteredDemandes = demandes.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'pending') return d.status === 'pending';
    if (filter === 'accepted') return d.status === 'accepted';
    if (filter === 'rejected') return d.status === 'rejected';
    if (filter === 'completed') return d.status === 'completed';
    return true;
  });

  const currentUserId = currentUser._id || currentUser.id;

  return (
    <div className="dem-demandes-page">
      <button className="dem-back-btn" onClick={() => onNavigate?.('home')}>
        ← Retour
      </button>

      <div className="dem-header">
        <h1>📋 Mes Demandes</h1>
        <p>Gérez vos demandes d'échange et de vente</p>
      </div>

      <div className="dem-filter-tabs">
        {[
          { key: 'pending', label: '⏳ En attente' },
          { key: 'accepted', label: '✅ Acceptées' },
          { key: 'rejected', label: '❌ Rejetées' },
          { key: 'completed', label: '🎉 Terminées' },
          { key: 'all', label: '📊 Toutes' },
        ].map(f => (
          <button
            key={f.key}
            className={filter === f.key ? 'dem-active' : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="dem-loading">⏳ Chargement...</div>
      ) : filteredDemandes.length === 0 ? (
        <div className="dem-empty">
          <span>📭</span>
          <p>Aucune demande trouvée</p>
        </div>
      ) : (
        <div className="dem-demandes-list">
          {filteredDemandes.map((demande) => {
            const isOwner = demande.proprietaireId === currentUserId;
            const otherParty = isOwner ? demande.demandeurName : demande.gardeOwner;

            return (
              <div key={demande._id} className="dem-demande-card">
                <div className="dem-demande-header">
                  <h3>
                    {demande.type === 'vente' ? '💰 Demande de vente' : '🔄 Demande d\'échange'}
                  </h3>
                  <span className={`dem-status-badge dem-${demande.status}`}>
                    {demande.status === 'pending' && '⏳ En attente'}
                    {demande.status === 'accepted' && '✅ Acceptée'}
                    {demande.status === 'rejected' && '❌ Rejetée'}
                    {demande.status === 'completed' && '🎉 Terminée'}
                  </span>
                </div>

                <div className="dem-demande-info">
                  <p>
                    <strong>{isOwner ? '👤 Demandeur:' : '🏥 Propriétaire:'}</strong> {otherParty}
                  </p>
                  <p><strong>📅 Date de garde:</strong> {new Date(demande.gardeDate).toLocaleDateString()}</p>
                  <p><strong>📩 Statut Directeur:</strong>
                    {demande.directorStatus === 'pending' && ' ⏳ En révision'}
                    {demande.directorStatus === 'approved' && ' ✅ Approuvé'}
                    {demande.directorStatus === 'rejected' && ' ❌ Rejeté'}
                    {!demande.directorStatus && ' - Non envoyé'}
                  </p>
                </div>

                <div className="dem-demande-actions">
                  {isOwner && demande.status === 'pending' && (
                    <>
                      <button className="dem-btn-accept" onClick={() => handleAccept(demande._id)}>
                        ✅ Accepter
                      </button>
                      <button className="dem-btn-reject" onClick={() => handleReject(demande._id)}>
                        ❌ Rejeter
                      </button>
                    </>
                  )}

                  {demande.status === 'accepted' && demande.directorStatus !== 'approved' && (
                    <button className="dem-btn-chat" onClick={() => handleOpenChat(demande)}>
                      💬 Ouvrir la conversation avec {otherParty}
                    </button>
                  )}

                  <button
                    className="dem-btn-messages"
                    onClick={() => onNavigate?.('message')}
                  >
                    📨 Voir tous les messages
                  </button>

                  {demande.directorStatus === 'pending' && (
                    <div className="dem-waiting-director">
                      ⏳ En attente de l'approbation du directeur...
                    </div>
                  )}

                  {demande.directorStatus === 'approved' && (
                    <div className="dem-approved">
                      🎉 Approuvé par le directeur! Échange complété.
                    </div>
                  )}

                  {demande.directorStatus === 'rejected' && (
                    <div className="dem-rejected-director">
                      ❌ Refusé par le directeur
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showChat && selectedDemande && (
        <DemandeChatModal
          demande={selectedDemande}
          currentUser={currentUser}
          onClose={() => {
            setShowChat(false);
            setSelectedDemande(null);
            fetchDemandes();
          }}
          onSendToDirector={() => {
            fetchDemandes();
          }}
        />
      )}
    </div>
  );
};

export default DemandesPage;
