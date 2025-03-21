TrelloPowerUp.initialize({
  'card-buttons': function(t, options) {
    return [{
      icon: 'https://cdn-icons-png.flaticon.com/512/992/992651.png',
      text: 'Set Story Points',
      callback: function(t) {
        return t.popup({
          title: 'Set Story Points',
          url: 'set-points.html'
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
    ]).then(function([storyPoints, openPoints, totalPoints, parentName, card, epicsListId, completedListId, boardChildren, cardListId]) {
      const badges = [];
      const storyPointsIcon = 'https://cdn-icons-png.flaticon.com/512/8305/8305062.png'; // New icon for story points
      const epicIcon = 'https://cdn-icons-png.flaticon.com/512/8860/8860871.png'; // Epic icon
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
          icon: storyPointsIcon,
          text: storyPoints,
          color: 'green'
        });
      }

      // Epic Card Badges
      if (openPoints && totalPoints) {
        badges.push({
          dynamic: async () => {
            const [newOpenPoints, newTotalPoints] = await updateEpicPoints(t, card, completedListId, boardChildren, openPoints, totalPoints);
            return {
              icon: epicIcon,
              text: `${newOpenPoints} / ${newTotalPoints}`,
              color: 'purple',
              refresh: 10
            };
          }
        });
      } else if (idList === epicsListId) {
        badges.push({
          icon: epicIcon,
          text: '',
          color: 'purple'
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
      const storyPointsIcon = 'https://cdn-icons-png.flaticon.com/512/8305/8305062.png'; // New icon for story points
      const epicIcon = 'https://cdn-icons-png.flaticon.com/512/8860/8860871.png'; // Epic icon
      const idList = cardIdList.idList;

      if (storyPoints) {
        badges.push({
          icon: storyPointsIcon,
          title: 'Points',
          text: storyPoints,
          color: 'green'
        });
      }
      if (parentCardId && parentCardName) {
        badges.push({
          icon: epicIcon,
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
      if (openPoints && totalPoints) {
        badges.push({
          icon: epicIcon,
          title: 'Points',
          text: `${openPoints} / ${totalPoints}`,
          color: 'purple'
        });
      } else if (idList === epicsListId) {
        badges.push({
          icon: epicIcon,
          title: 'Epic',
          text: 'Epic Card',
          color: 'purple'
        });
      }

      return badges;
    }).catch(error => {
      console.error('Error in card-detail-badges:', error);
      return [];
    });
  },

  'attachment-sections': function(t, options) {
    return Promise.all([
      t.get('board', 'shared', 'childCards'),
      t.card('id'),
      t.card('attachments')
    ]).then(function([boardChildren, card, attachments]) {
      console.log('Epic Card attachment-section: ', card.id);
      const children = boardChildren[card.id] || [];
      const epicProgressUrl = 'https://alvy023.github.io/trello-epic-story-points/epic-progress.html';
      let claimed = false;
      if (children.length > 0) {
        if (attachments && attachments.attachments) {
          claimed = attachments.attachments.filter(attachment => attachment.url === epicProgressUrl);
        }
        if (!claimed) {
          console.log("Attaching Epic Progress for card ID:", card.id);
          t.attach({
            name: 'Epic Progress',
            url: t.signUrl(epicProgressUrl),
          });
          claimed = true;
        }
      }
      return [{
        id: 'epic-progress',
        claimed: claimed,
        icon: 'https://cdn-icons-png.flaticon.com/512/8860/8860871.png',
        title: 'Epic Progress',
        content: {
          type: 'iframe',
          url: t.signUrl(epicProgressUrl),
          height: 250
        }
      }];
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

async function updateEpicPoints(t, card, completedListId, boardChildren, openPoints, totalPoints) {
  const children = (boardChildren && boardChildren[card.id]) || [];
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

  await t.set(card.id, 'shared', 'totalPoints', newTotalPoints);
  await t.set(card.id, 'shared', 'openPoints', newOpenPoints);

  return [newOpenPoints, newTotalPoints];
}
