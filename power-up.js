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

    t.subscribe('card-moved', function(event) {
      const movedCardId = event.card.id;
      const newListId = event.newList.id;

      console.log("Card moved:", movedCardId, "to list:", newListId);

      t.get('board', 'shared', 'epicsListId')
        .then(epicListId => {
          console.log("Epic List ID:", epicListId);
          return t.get('board', 'shared', 'completeListId')
            .then(completeListId => {
              console.log("Complete List ID:", completeListId);
              return { epicListId, completeListId };
            });
        })
        .then(({ epicListId, completeListId }) => {
          const movedToComplete = newListId === completeListId;
          const movedFromComplete = event.oldList === completeListId;

          if (movedToComplete || movedFromComplete) {
            console.log("Card moved to/from Complete list. Checking parent...");
            t.get(movedCardId, 'shared', 'parentCardId')
              .then(epicCardId => {
                if (epicCardId) {
                  console.log("Parent Epic Card ID:", epicCardId);
                  recalculateEpicPoints(t, epicCardId, epicListId, completeListId);
                } else {
                  console.log("No parent card found for card:", movedCardId);
                }
              });
          } else {
            console.log("Card moved within other lists, skipping recalculation.");
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

function recalculateEpicPoints(t, epicCardId, epicListId, completeListId) {
  console.log("Recalculating Epic points for card:", epicCardId, "in list:", epicListId);

  return t.lists.get(epicListId, { cards: 'all' })
    .then(list => {
      console.log("Cards in Epic List:", list.cards.length);

      const childCards = list.cards.filter(card => {
        return t.get('card', card.id, 'shared', 'parentCardId')
          .then(parentCardId => {
            console.log("Checking parentCardId for card:", card.id, "Parent:", parentCardId);
            return parentCardId === epicCardId;
          });
      });

      return Promise.all(childCards).then(resolvedChildCards => {
        console.log("Filtered Child Cards:", resolvedChildCards.length);
        return resolvedChildCards;
      });
    })
    .then(childCards => {
      let totalPoints = 0;
      const promises = childCards.map(childCard => {
        return t.get('card', childCard.id)
          .then(childCardDetails => {
            const childListId = childCardDetails.idList;
            console.log("Child Card:", childCard.id, "List ID:", childListId);
            if (childListId !== completeListId) {
              return t.get('card', childCard.id, 'shared', 'storyPoints')
                .then(points => {
                  console.log("Child Card:", childCard.id, "Points:", points);
                  totalPoints += parseInt(points) || 0;
                })
                .catch(error => {
                  console.error("Error getting points for card:", childCard.id, error);
                });
            } else {
              console.log("Child Card:", childCard.id, "in Complete list, skipping.");
            }
          });
      });

      return Promise.all(promises).then(() => {
        console.log("Total points calculated:", totalPoints);
        return totalPoints;
      });
    })
    .then(totalPoints => {
      console.log("Setting total points for Epic card:", epicCardId, "to:", totalPoints);
      return t.set('card', epicCardId, 'shared', 'totalPoints', totalPoints.toString())
        .then(() => {
          return t.set('card', epicCardId, 'badges', {
            text: totalPoints.toString(),
            color: 'green'
          });
        });
    })
    .then(() => console.log("Epic card points and badge updated successfully."))
    .catch(error => {
      console.error("Error recalculating Epic points:", error);
    });
}
