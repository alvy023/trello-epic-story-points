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
      t.get('card', 'shared', 'parentCardId'),
      t.get('board', 'shared', 'epicsListId'),
      t.get('board', 'shared', 'completedListId'),
      t.get('board', 'shared', 'childCards'),
      t.card('idList')
    ]).then(function([storyPoints, openPoints, totalPoints, parentName, parentId, epicsListId, completeListId, boardChildren, cardListId]) {
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
      console.log("card-badges idList: ", idList)
      console.log("card-badges epicsListId: ", epicsListId)
      if (idList === epicsListId) {
        badges.push({
          text: epicLabel,
          color: 'purple'
        });
      }
      console.log("card-badges openPoints: ", openPoints)
      console.log("card-badges totalPoints: ", totalPoints)
      if (openPoints && totalPoints) {
        badges.push({
          dynamic: function () {
            [newOpenPoints, newTotalPoints] = updateEpicPoints(openPoints, totalPoints);
            return {
              title: 'Points',
              text: `${newOpenPoints} / ${newTotalPoints}`,
              color: 'green',
              refresh: 10
            }
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
      console.log("card-detail idList: ", idList)
      console.log("card-detail epicsListId: ", epicsListId)
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
  },

  'on-disable': function(t, options) {
    console.log('Power-Up disabled');
  }
});

func updateEpicPoints(openPoints, totalPoints) {
  // Run the child-cards routine
  console.log("updateEpicPoints openPoints: ", openPoints)
  console.log("updateEpicPoints totalPoints: ", totalPoints)
  return [openPoints, totalPoints];
}
