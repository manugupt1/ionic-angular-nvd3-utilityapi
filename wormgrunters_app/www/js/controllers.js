angular.module('starter.controllers', [])

.controller('AppCtrl', function ($scope, $ionicModal, $timeout) {

    // With the new view caching in Ionic, Controllers are only called
    // when they are recreated or on app start, instead of every page change.
    // To listen for when this page is active (for example, to refresh data),
    // listen for the $ionicView.enter event:
    //$scope.$on('$ionicView.enter', function(e) {
    //});

    // Form data for the login modal
    $scope.loginData = {};

    // Create the login modal that we will use later
    $ionicModal.fromTemplateUrl('templates/login.html', {
        scope: $scope
    }).then(function (modal) {
        $scope.modal = modal;
    });

    // Triggered in the login modal to close it
    $scope.closeLogin = function () {
        $scope.modal.hide();
    };

    // Open the login modal
    $scope.login = function () {
        $scope.modal.show();
    };

    // Perform the login action when the user submits the login form
    $scope.doLogin = function () {
        console.log('Doing login', $scope.loginData);

        // Simulate a login delay. Remove this and replace with your login
        // code if using a login system
        $timeout(function () {
            $scope.closeLogin();
        }, 1000);
    };
})


.controller('GoallistsCtrl', function ($scope) {
    $scope.goals = [
      { title: 'Neighbour takedown', id: 1 },
      { title: 'Replacing CFLs', id: 2 },
      { title: 'Using Energy star equipment', id: 3 },
      { title: 'Cold wash water', id: 4 },
      { title: 'Turning down my refrigerator temp.', id: 5 }
    ];
})

.controller('GoallistCtrl', function ($scope, $stateParams) {
    // Ideally it should use the API, getGoalStatus(user) or getGoalStatus(user,goalId) The former has less mining, and is a one off operation if the states are maintained properly
    goalRes = [
        { userID: 1, status: 0.1, goalId: 1 },
        { userID: 1, status: 0.6, goalId: 2 },
        { userID: 1, status: 0.9, goalId: 3 },
        { userID: 1, status: 0.3, goalId: 4 },
        { userID: 1, status: 0.8, goalId: 5 }
    ];

    $scope.goalId = $stateParams.goalId;


    for (i = 0; i < goalRes.length; ++i) {
        if ($scope.goalId == goalRes[i].goalId) {
            var res = goalRes[i].status * 100;
            $scope.goalRes = "You are " + res.toString() + "% to your goal";
            break;
        }
    }
})


.controller('UsageCtrl', function ($scope, $http) {

    // Get today's date
    var end = new Date('2015-02-20T07:00:00.000000+00:00');
    var start = new Date('2015-02-19T07:00:00.000000+00:00');

    var me_total = 0.0, them_total = 0.0, me_mean = 0.0, them_mean = 0.0, me_peak = 0.0, them_peak = 0.0;
    var me_peak_time, them_peak_time;
    var my_data = [], neighbor_data = [];

    function utilityAPI_IntervalData(user, start, end) {
        api_url = "https://utilityapi.com/api/intervals.json?access_token=f064b93532b54b0d86d63753157610ff&services=" + user.toString() + "&start=" + start.toISOString() + "&end=" + end.toISOString();

        $http({
            method: 'GET',
            url: api_url
        }).then(function successCallback(response) {
            // this callback will be called asynchronously
            // when the response is available
            for (var x in response.data) {
                var my_unit_data = { x: new Date(response.data[x].interval_start), y: response.data[x].interval_kW }
                my_data.push(my_unit_data);
                me = my_data.push(my_unit_data)
                var toss_a_coin = Math.random()
                if (toss_a_coin > 0) {
                    var neighbor_unit_data = { x: new Date(response.data[x].interval_start), y: response.data[x].interval_kW - Math.random() }
                } else {
                    var neighbor_unit_data = { x: new Date(response.data[x].interval_start), y: response.data[x].interval_kW + Math.random() }
                }

                if (neighbor_unit_data.y < 0) {
                    neighbor_unit_data.y = Math.random()
                }
                neighbor_data.push(neighbor_unit_data);

                me_total += my_unit_data.y
                them_total += neighbor_unit_data.y
                if (my_unit_data.y > me_peak) {
                    me_peak = my_unit_data.y
                    me_peak_time = (new Date(response.data[x].interval_start)).getHours()
                }
                if (neighbor_unit_data.y > them_peak)
                    them_peak = them_total
            }
            them_mean = them_total / neighbor_data.length
            me_mean = me_total / my_data.length


            $scope.percent = (((me_total) / (them_total)) * 100)
            $scope.me_peak_time = me_peak_time.toFixed(2)
            $scope.me_peak = me_peak.toFixed(2)
            //Prediction, this is a very bad  formula
            $scope.me_mean = (me_mean * my_data.length * 30 * 0.12).toFixed(2);
            $scope.them_mean = (them_mean * neighbor_data.length * 30 * 0.12).toFixed(2);

            if ($scope.percent > 100) {
                $scope.percent = $scope.percent - 100;
                window.localStorage.setItem("loss",(me_total-them_total).toFixed(2))
                $scope.percent = "You are using " + ($scope.percent).toFixed(2) + "% more than your neighbors"
                $scope.earnings_report = "Your neighbors will save " + ($scope.me_mean - $scope.them_mean).toFixed(2) + "$ more than you";

            } else {
                $scope.percent = 100 - $scope.percent;
                $rootScope.loss = 0;
                window.localStorage.setItem("profit", (them_total - me_total).toFixed(2));
                $scope.percent = "Yay!! You are saving " + $scope.percent.toFixed(2) + "% electricity as compared to your your neighbors"
                $scope.earnings_report = "Woo! You are saving " + ($scope.them_mean - $scope.me_mean).toFixed(2) + "$ more than your neighbors"

            }



        }, function errorCallback(response) {
            // called asynchronously if an error occurs
            // or server returns response with an error status.
            console.log("failure");
        });

        return [
            {
                values: my_data,      //values - represents the array of {x,y} data points
                key: 'Me', //key  - the name of the series.
                color: '#0A8B22', //color - optional: choose your own line color.
                area: true
            },
            {
                values: neighbor_data,
                key: 'Neighborhood',
                color: '#C84028',
                area: false      //area - set to true if you want this line to turn into a filled area chart.
            }
        ];
    }

    var vm = {}
    vm.options = {
        chart: {
            type: 'lineChart',
            height: 250,
            margin: {
                top: 20,
                right: 10,
                bottom: 20,
                left: 10
            },
            x: function (d) { return d.x; },
            y: function (d) { return d.y; },
            useInteractiveGuideline: false,
            showYAxis: true,
            dispatch: {
                stateChange: function (e) { console.log("stateChange"); },
                changeState: function (e) { console.log("changeState"); },
                tooltipShow: function (e) { console.log("tooltipShow"); },
                tooltipHide: function (e) { console.log("tooltipHide"); }
            },
            xAxis: {
                axisLabel: 'Time'
            },
            yAxis: {
                axisLabel: 'Power (KwH)',
                tickFormat: function (d) {
                    return d3.format('.02f')(d);
                },
                axisLabelDistance: -5
            },
            callback: function (chart) {
                console.log("!!! lineChart callback !!!");
            }
        },
        title: {
            enable: true,
            text: start.toDateString(),
            css: {
                textAlign: "center",
                color: "white"
            }
        }
    };

    var end = new Date('2015-02-20T07:00:00.000000+00:00');
    var start = new Date('2015-02-19T07:00:00.000000+00:00');
    var user = 40172;
    vm.data = utilityAPI_IntervalData(user, start, end);
    $scope.vm = vm;

})

.controller('neighborhoodCtrl', function ($scope) {

    var water_gallon = 0.44 // Vishnu's image 40/90
    var coal_pounds = 1.04 //http://www.eia.gov/tools/faqs/faq.cfm?id=667&t=2
    var electricity_kwh = 911 //http://www.eia.gov/tools/faqs/faq.cfm?id=97&t=3
    var loss = window.localStorage.getItem("loss")
    var profit = window.localStorage.getItem("profit")
   
    if (loss) {
        loss = parseFloat(loss);
        //Enter negative message
        $scope.individual = "By saving " + loss.toFixed(2) + " kwH, you could have saved " + (loss*water_gallon).toFixed(2) + " gallons of fresh water."
        $scope.neighbor = "If the entire neighborhood saves " + loss.toFixed(2) + " kwH, then we could have saved " + (loss*coal_pounds*100).toFixed(2) + " pounds of coal"
        $scope.global = "If everyone avoids waste of " + (loss).toFixed(2) + " kwH, then we could have powered " + ((loss * 1000000) / electricity_kwh).toFixed(0) + " homes";

    } else {
        profit = parseFloat(profit)
        // Enter positive message even when it is 0
        $scope.individual = "By saving " + profit.toFixed(2) + " kwH, you have saved " + (profit * water_gallon).toFixed(2) + " gallons of fresh water."
        $scope.neighbor = "If the entire neighborhood saves " + profit.toFixed(2) + " kwH like you, then we can save " + (profit * coal_pounds * 100).toFixed(2) + " pounds of coal"
        $scope.global = "If everyone saves " + (profit).toFixed(2) + " kwH like you, then we could have powered " + ((profit * 1000000) / electricity_kwh).toFixed(0) + " homes";
    }
});