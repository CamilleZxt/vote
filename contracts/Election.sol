pragma solidity ^0.5.16;
 
contract Election {
 
    //结构体
    struct Candidate {
        uint id;
        string name;
        uint voteCount;
    }
 
    //事件
    event votedEvent(
        uint indexed _candidateId
    );
 
    //存储结构体
    mapping (uint => Candidate) public candidates;
    //是否已经投票了
    mapping (address=>bool) public voters;
 
    //总数量
    uint public candidateCount;
 
    //构造函数
    constructor() public {
        addCandidate("张三");
        addCandidate("李四");
    }
 
    //添加候选人
    function addCandidate(string memory _name) private {
        candidateCount ++;
        candidates[candidateCount] = Candidate(candidateCount, _name, 0);
    }
 
    //投票
    function vote(uint _candidateId) public {
 
        //过滤
        require(!voters[msg.sender]);
        require(_candidateId > 0 && _candidateId <= candidateCount);
 
        //记录用户已经投票了
        voters[msg.sender] = true;
        candidates[_candidateId].voteCount ++;
 
        emit votedEvent(_candidateId);
    }
 
}