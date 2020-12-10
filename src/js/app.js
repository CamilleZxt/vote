// initWeb3方法里面主要是对web3.js进行初始化。
// initContract方法中
// getJSON 方法是从本地读取json文件，在json文件读取成功后，再调用 Truffle 的 TruffleContract 方法进行合约初始化。
// 初始化合约后，通过 setProvider 方法我这里理解是设置代理。
// 其他的都是调取的web3.js提供的api，除了api之外我觉得最有必要解释的是 App.contracts.Election.deployed().then(function(instance)... 这一串代码，这是实例化Election合约后会调取后面then 里面的方法同时，把实例化的变量通过 instance 带入到方法的参数里面。

// 同时在then里面有返回了一个方法 return instance.vote(candidateId,{from: App.account}); 这个方法又会执行，执行完后，又把执行的结果待会给下一个 then ，依次类推，这貌似是es6的链式语法。

App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function () {
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      console.warn("Meata");
    } else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function () {

    $.getJSON("Election.json", function (election) {

      App.contracts.Election = TruffleContract(election);
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.reander();
    })

  },

  reander: function () {

    var electionInstance;
    var $loader = $("#loader");
    var $content = $("#content");

    $loader.show();
    $content.hide();

    //获得账号信息
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("您当前的账号: " + account);
      }
    });

    //加载数据
    App.contracts.Election.deployed().then(function (instance) {
      console.log(instance)
      electionInstance = instance;
      return electionInstance.candidateCount();
    }).then(function (candidatesCount) {
      var $candidatesResults = $("#candidatesResults");
      $candidatesResults.empty();

      var $cadidatesSelect = $("#cadidatesSelect");
      $cadidatesSelect.empty();

      for (var i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function (candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
          $candidatesResults.append(candidateTemplate);

          //投票
          var cadidateOption = "<option value='" + id + "'>" + name + "</option>";
          $cadidatesSelect.append(cadidateOption);

        });
      }

      return electionInstance.voters(App.account);

    }).then(function (hasVoted) {

      if (hasVoted) {
        $('form').hide();
      }
      $loader.hide();
      $content.show();

    }).catch(function (err) {
      console.warn(err);
    });

  },

  //投票
  castVote: function () {

    var $loader = $("#loader");
    var $content = $("#content");

    var candidateId = $('#cadidatesSelect').val();

    App.contracts.Election.deployed().then(function (instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function (result) {
      $content.hide();
      $loader.show();
    }).catch(function (err) {
      console.warn(err);
    });

  },

  //监听事件
  listenForEvents: function () {
    App.contracts.Election.deployed().then(function (instance) {
      instance.votedEvent({}, {
        formBlock: 0,
        toBlock: 'latest'
      }).watch(function (error, event) {
        console.log("event triggered", event);
        App.reander();
      });
    })
  }

};

$(function () {
  $(window).load(function () {
    App.init();
  });
});