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
      t.get('card', 'shared', 'openPoints'),
      t.get('card', 'shared', 'totalPoints'),
      t.get('card', 'shared', 'parentCardName'),
      t.card('id'),
      t.get('board', 'shared', 'epicsListId'),
      t.get('board', 'shared', 'completedListId'),
      t.get('board', 'shared', 'childCards'),
      t.card('idList')
    ]).then(function([storyPoints, openPoints, totalPoints, parentName, id, epicsListId, completedListId, boardChildren, cardListId]) {
      const badges = [];
      const epicLabel = "Epic";
      const idList = cardListId.idList;
      // Child Card Badges
      if (parentName) {
        badges.push({
          text: parentName,
          color: 'purple'
        });
      }
      if (storyPoints) {
        badges.push({
          text: storyPoints,
          color: 'green'
        });
      }
      // Epic Card Badges
      if (idList === epicsListId) {
        badges.push({
          text: epicLabel,
          color: 'purple'
        });
      }
      if (openPoints && totalPoints) {
        badges.push({
          dynamic: async () => {
            const [newOpenPoints, newTotalPoints] = await updateEpicPoints(t, id, completedListId, boardChildren, openPoints, totalPoints);
            return {
              title: 'Points',
              text: `${newOpenPoints} / ${newTotalPoints}`,
              color: 'green',
              refresh: 10
            };
          }
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
      t.get('card', 'shared', 'openPoints'),
      t.get('card', 'shared', 'totalPoints'),
      t.get('card', 'shared', 'parentCardId'),
      t.get('card', 'shared', 'parentCardName'),
      t.get('board', 'shared', 'epicsListId'),
      t.card('idList')
    ]).then(function ([storyPoints, openPoints, totalPoints, parentCardId, parentCardName, epicsListId, cardIdList]) {
      const badges = [];
      const idList = cardIdList.idList;
      if (storyPoints) {
        badges.push({
          title: 'Points',
          text: storyPoints,
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
          title: 'Epic',
          text: 'Epic Card',
          color: 'purple'
        });
      }
      if (openPoints && totalPoints) {
        badges.push({
          title: 'Points',
          text: `${openPoints} / ${totalPoints}`,
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
            title: 'Story Cards',
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
  },

  'on-disable': function(t, options) {
    console.log('Power-Up disabled');
  }
});

async function updateEpicPoints(t, id, completedListId, boardChildren, openPoints, totalPoints) {
    const children = (boardChildren && boardChildren[id.id]) || [];
    let newOpenPoints = 0;
    let newTotalPoints = 0;

    if (children.length === 0) {
        return [openPoints, totalPoints];
    }

    for (const child of children) {
        try {
            const [points, idList] = await Promise.all([
                t.get(child.id, 'shared', 'storyPoints'),
                t.cards('id', 'idList').then(cards => cards.find(c => c.id === child.id).idList)
            ]);

            let pointsInt = 0;
            if (points) {
                pointsInt = parseInt(points.toString(), 10);
                newTotalPoints += pointsInt;
                if (idList !== completedListId) {
                    newOpenPoints += pointsInt;
                }
            }
        } catch (error) {
            console.error('Error retrieving points for child:', child.id, error);
        }
    }

    await t.set(id.id, 'shared', 'totalPoints', newTotalPoints);
    await t.set(id.id, 'shared', 'openPoints', newOpenPoints);

    return [newOpenPoints, newTotalPoints];
}
