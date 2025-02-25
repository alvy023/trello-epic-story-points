TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
      text: 'Set Story Points',
      callback: function(t) {
        return t.popup({
          title: 'Set Story Points',
          url: 'story-points.html'
        });
      }
    }, {
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
      text: 'Set Parent Card',
      callback: function(t) {
        return t.popup({
          title: 'Set Parent Card',
          url: 'set-parent.html'
        });
      }
    }];
  },

  'card-badges': function(t, options) {
    return Promise.all([
      t.get('card', 'shared', 'storyPoints'),
      t.get('card', 'shared', 'parentCardName'),
      t.get('card', 'shared', 'totalPoints'),
      t.get('board', 'shared', 'epicsListId'),
      t.card('id')
    ]).then(function([points, parentName, totalPoints, epicsListId, cardData]) {
      const badges = [];
      const idList = cardData.idList;
      if (parentName) {
        badges.push({
          text: parentName,
          color: 'purple'
        });
      }
      if (points) {
        badges.push({
          text: points,
          color: 'green'
        });
      }
      if (idList === epicsListId) {
        badges.push({
          text: 'Epic',
          color: 'purple'
        });
      }
      if (totalPoints) {
        badges.push({
          text: totalPoints,
          color: 'green'
        });
      }
      return badges;
    }).catch(error => {
      console.error('Error in card-badges:', error);
      return [];
    });
  },

  'card-detail-badges': function (t, options) {
    return Promise.all([
      t.get('card', 'shared', 'storyPoints'),
      t.get('card', 'shared', 'parentCardId'),
      t.get('card', 'shared', 'parentCardName'),
      t.get('card', 'shared', 'totalPoints'),
      t.get('board', 'shared', 'epicsListId'),
      t.card('id')
    ]).then(function ([points, parentCardId, parentCardName, totalPoints, epicsListId, cardData]) {
      const badges = [];
      const idList = cardData.idList;
      if (points) {
        badges.push({
          title: 'Points',
          text: points,
          color: 'green'
        });
      }
      if (parentCardId && parentCardName) {
        badges.push({
          title: 'Epic',
          text: parentCardName,
          color: 'purple',
          callback: function (t) {
            return t.navigate({
              url: `https://trello.com/c/${parentCardId}`,
              target: 'current'
            });
          }
        });
      }
      if (idList === epicsListId) {
        badges.push({
          title: '',
          text: 'Epic',
          color: 'purple'
        });
      }
      if (totalPoints) {
        badges.push({
          title: 'Points',
          text: totalPoints,
          color: 'green'
        });
      }
      return badges;
    }).catch(error => {
      console.error('Error in card-detail-badges:', error);
      return [];
    });
  },

  'card-back-section': function (t, options) {
    return t.card('id').then(function(card) {
      return t.get('board', 'shared', 'childCards').then(function (boardChildren) {
        var children = (boardChildren && boardChildren[card.id]) || [];
        if (children.length === 0) {
          return [];
        }
        return [
          {
            title: 'Child Cards',
            icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
            content: {
              type: 'iframe',
              url: t.signUrl('./child-cards.html')
            }
          }
        ];
      });
    }).catch(error => {
      console.error('Error in card-back-section:', error);
      return [];
    });
  },

  'show-settings': function(t, options) {
    return t.popup({
      title: 'Settings',
      url: 'settings.html',
      height: 184
    });
  },

  'on-enable': function(t, options) {
    console.log('Power-Up enabled');

    // Subscribe to card-moved events
    Trello.subscribe('card-moved', function(event) {
      const cardId = event.card.id;
      const newListId = event.newList.id;

      Trello.get('board', 'shared', 'epicsListId')
        .then(epicListId => {
          return Trello.get('board', 'shared', 'completeListId')
            .then(completeListId => ({ epicListId, completeListId }));
        })
        .then(({ epicListId, completeListId }) => {
          const movedToComplete = newListId === completeListId;
          const movedFromComplete = event.oldList === completeListId;

          if (movedToComplete || movedFromComplete) {
            Trello.get('card', cardId, 'shared', 'parentCardId') // Assuming you store parentCardId
              .then(epicCardId => {
                if (epicCardId) {
                  recalculateEpicPoints(epicCardId, completeListId);
                }
              });
          }
        });
    });
  },

  'on-disable': function(t, options) {
    console.log('Power-Up disabled');

    // Retrieve the stored token
    t.get('board', 'shared', 'cardMovedToken')
      .then(token => {
        if (token) {
          Trello.unsubscribe('card-moved', token);
          console.log('Unsubscribed from card-moved events.');
          return t.remove('board', 'shared', 'cardMovedToken'); // Clean up the stored token
        } else {
          console.log('No card-moved subscription to unsubscribe from.');
          return Promise.resolve(); // Return a resolved promise if there's no token.
        }
      })
      .catch(error => {
        console.error("Error unsubscribing:", error);
      });
  }
});

function recalculateEpicPoints(epicCardId, completeListId) {
  Trello.get('card', epicCardId, 'idList')
    .then(epicListId => {
       return Trello.lists.get(epicListId, { cards: 'all' });
    })
    .then(list => {
        const childCards = list.cards.filter(card => {
            return Trello.get('card', card.id, 'shared', 'parentCardId')
            .then(id => id === epicCardId);
        });

        return Promise.all(childCards);
    })
    .then(childCards => {
        let totalPoints = 0;
        const promises = childCards.map(childCard => {
            return Trello.get('card', childCard.id, 'idList')
            .then(childListId => {
                if (childListId !== completeListId) {
                    return Trello.get('card', childCard.id, 'shared', 'storyPoints')
                    .then(points => {
                        totalPoints += parseInt(points) || 0; // Handle cases where points aren't set or are non-numeric
                    }).catch(error => {
                        console.error("Error getting points for card:", childCard.id, error);
                    });
                }
            });
        });

        return Promise.all(promises).then(() => totalPoints);
    })
    .then(totalPoints => {
        return Trello.set('card', epicCardId, 'shared', 'totalPoints', totalPoints.toString())
        .then(() => {
            return Trello.set('card', epicCardId, 'badges', {
                text: totalPoints.toString(),
                color: 'green'
            });
        });
    }).catch(error => {
        console.error("Error recalculating Epic points:", error);
    });
}
