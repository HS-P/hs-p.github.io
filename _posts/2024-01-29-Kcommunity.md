---
title: K-Community 1
date: 2024-01-29 09:00:00 +0900
categories: ['2024', 'K-Community']
pin: true
---

# K-Community란?
---

![Image](/posts/kcposter.jpg)

- 출처: [한국 기술 교육 대학교 홈페이지](https://portal.koreatech.ac.kr/p/STHOME/) - 일반공지 31536번

전문 Consultant의 지도 하 진행하는 **동계 계절학기 K-Community!**
*(사실 컨설턴트님께서는 전공적 지식에 대한 피드백이 아닌, 일정과 결과물에 대한 피드백을 주로 제공하십니다.)*

이번 방학때 우리는 내년에 진행할 [R-BIZ 우주 탐사 로봇](https://www.korearobot.or.kr/wp/2023/07/21/%EC%A0%9C-9%ED%9A%8C-r-biz-%EC%B1%8C%EB%A6%B0%EC%A7%80-%EC%B0%B8%EA%B0%80%EC%9E%90-%EB%AA%A8%EC%A7%91-%EA%B3%B5%EA%B3%A0%EC%9E%90%EC%9C%A8%EC%A3%BC%ED%96%89-%EB%A1%9C%EB%B4%87-%EA%B4%80%EB%A0%A8/)과 [국방 로봇 경진 대회](https://www.kiro.re.kr/cul/cintro.asp)에 참가하기 위한 실력을 증진시킬 계획을 세우고 있었다.

그 과정에서, 간단한 결과 보고서와 제출물, 발표만 진행한다면 **30만원의 장학금**을 지원해준다는 눈이 번쩍 뜨이게 하는 활동이 있었다.

엄청난 기회를 놓칠 수 없어, 우리는 이번 계획을 알차게 구성하고 우수 팀으로 선정되면 지급되는 **추가 장학금**까지 노려보기로 했다.

*'활동에서 지출되는 비용, 그리고 너덜너덜해지는 공학생들의 지갑을 채워줄 용돈까지!'*

완전 행복한 마음가짐으로 우리는 보고서를 작성했다.

#계획 세우기
---
이번 우리 방학은 [1차 회의록](https://cafe.naver.com/letsmake/3296)에도 조금 더 상세히 나와있지만, 각자 역할에서 **상위 수준**에 달성하는 것에 목표를 두었다.

**명확한 결과물, 정확한 지식**을 얻는 걸 목표로 했던 우리는, 우리의 랩실에 비치된 **터틀봇**을 구동시키고, Gazebo와 Rviz를 통한 Simulation, Laidar 센서를 이용하여 정보를 수집하고 이를 바탕으로 자율주행을 목표로 삼았다.

물론, 터틀봇을 최종 구동하는 데에는 결과적으로 실패했다.  
(이는 [터틀봇](https://cafe.naver.com/turtlebot)에서 이유가 상세히 설명되어 있다.)

그렇다면, 1월까지 진행하는 K-Community에서는 무엇을 해야 할까?  

> 우리가 알고 있는 것은 무엇일까?

우리는 라즈베리파이와 아두이노에 대해서 잘 알지 못한다.  
3학년 1학기 정규 과정인 '마이크로프로세스' 통칭 **'마프'** 과목을 아직 이수하지 못했다.  
물론, 상당히 중요한 과목에 **Embedded SW**에 관심이 있는 나에게는 매우 중요한 과목이다.

우리는 이번 방학때 아두이노와 라즈베리파이, 우분투 환경에서 ROS를 확실하게 익히려는 시도를 해보기로 했다.

![Image](/posts/kcplan.png)

그래서 우리는 위와 같은 플랜을 세웠다.  
물론, 최종적으로는 아두이노 센서 대신 라이다 센서를 목표로 설정했는데 위 계획서에는 아두이노라고 표기했다.  
(아두이노는 2주차 때 라인트레이싱 코드를 분석하는 것으로 간단하게 합의를 보았다.)

**터틀봇을 구동하기만 하면 30만원이라니!**

---

### 1주차 활동

이렇게 플랜을 세운 우리는 천교수님께 서명을 받고 팀을 구성해 5인이서 활동을 시작했다.

> 정규 학기가 아직 끝나지 않았다!

놀랍게도, 이 K-Community는 **동계**라고 적혀 있었지만, 12월 15일에는 **학기가 끝나지 않았다.** 정확히는, 12월 15일에 시험이 있었다.  
*(사실 그래서, 계획서에도 그날은 좀 널널하게 잡아두었다.)*  

우리는 모여서 사전에 해야 할 일을 정했고, 이 날까지 백준 Python "왕초보" 문제를
50개 풀어오기로 했다. 

*사실, 우리가 이걸 왜 해야 하는지는 잘 몰랐다. 단지, ROS를 하기 위해선 Python을 잘 아야 한다는 이야기를 들었다.*

![Image](/posts/kc1.png)

2주차 때에는 계절학기가 시작하고 중간고사 이전의 기간이 된다.  
*(사실상, 4주차 시행 날짜까지는 계절학기의 일정이 목을 죄여왔다.)*  

그럼에도 우리는 꾸준히 하루에 한 시간 이상 Python 문제풀이에 최선을 다했다.  
4주차, Raspberry PI에 본격 돌입하기 전까지는 매주 Python 문제를 50문제씩 풀어서, **최소 150문제**를 풀어낼 수 있다고 생각했다. 
 
정리하자면, 1주차 때에는 계획을 세우고 로봇을 움직여 결승선으로 이동하게 만들어 보자는 목표를 세웠다.  
최종 목표로 세웠지만, 사실 불안불안 했다. 마치 [배틀로봇](https://hs-p.github.io/posts/battle/) 때의 악몽이 떠오르는 듯 싶었다.

---

### 2주차 활동
![Image](/posts/kc2.png)

2주차 때에는 계절학기가 시작하고 **중간고사**가 끝났거나, 혹은 없는 날이었다.  
*(과목의 특성상 중간과제로 변경되는 경우가 있었다.)*  

이 날은, Arduino 센서를 보고, 아두이노에 대한 이해도를 높이고자 왔다.  
~~아두이노는 아이들이나 갖고 노는 장난감이라고 생각했다. 훗날 Opencr Firmware Uploading을 하기 전까진...~~
우리는 '**로봇사랑 동아리**'에 사전 비치되어 있는 아두이노 로봇을 가져왔다.  
이후, 라인트레이싱 코드를 아두이노에 입력하여 센서를 통해 **정보값을 받아오고** 이에 따라 **바퀴가 움직이는 모습**을 관찰했다.  

우리가 처음으로 했던 생각은, *"뭐야 간단한데?"* 였다.  
코드는 길어야 스무줄이 체 되지 않았고, 각 줄은 간단명료하게 금방 이해할 수 있었다.  
**간단한 IF문 몇 줄**이면 완성된다니, 이렇게 간단한 일일 줄이야!  

어쩌면 우리가 움직이는 터틀봇도 금방 끝날 수도 있지 않을까? 라는 생각에 빠졌다.  
그렇게 우리는 아두이노 예제 코드를 돌려보며 이해하고 가볍게 코드를 건드려보는 시간을 가졌다.  
*(속도를 바꾼다거나, 색깔을 인식하는 수치를 바꿔본 다거나, 등)*

---

### 3주차 활동
![Image](/posts/kc3.png)

3주차, 이제부터 제대로 된 시작을 알렸다.  
터틀봇 활동에 관한 디테일한 내용은 [터틀봇 포스팅](https://hs-p.github.io/posts/turtlebot)에서 확인해 보면 될 것 같다.  

터틀봇이 도착하고, H/W 담당인 팀원은 터틀봇을 뜯어보며 분해하기 시작했다.  
동시에, SW는 두 팀으로 나뉘어 각각 역할을 수행했는데, 정리하자면 아래와 같다.  

>역할 분배
>>TEAM HW | 터틀봇 분해 및 재조립, 하드웨어적 구성, OPENCR 구성 이해 및 확인  
>>TEAM SW 1 | 본인의 노트북에 Ubuntu Desktop 22.04LTS 환경 조성. (ROS까지 설치)  
>>TEAM SW 2 | 라즈베리파이에 사전 동봉된 SD카드를 꽂아 구성된 환경 확인, Ubuntu installation.  

본 필자는 **소프트웨어 1팀**에 들어갔는데, 사실 이 날은 많은 일을 하지 못했다.  
이유는 간단하게도, 필요한 재료들이 너무나도 많았다.  

분해하기 위한 공구들부터 시작해서, OPENCR 1.0에 불이 들어오지 않는 문제가 발생했다.
**이 오류**가 우리가 겪을 백여 가지에 가까운 오류 중 첫 번째였던 것 같다.

Ubuntu 22.04 Desktop을 SW 1팀인 본인의 노트북에 설치하는 과정은 플립러닝 방식으로 따로 깔아오기로 하고,  
이 날은 하드웨어적 조립, 분해, 오류를 찾는 데 돌입했다.

![Image](/posts/kc32.png)

*(심지어 파워 케이블도 누락되어 있었다. 망할!)*

그렇게 첫 번째 난관에 봉착한 우리는 **OPENCR 1.0 오류**를 해결할 방안에 대해서 논의 및 토론을 시작했다.
앉아서 화이트보드에 문제점들을 정리하기 시작했다.  

이제는 우리도 Trouble Shooting 과정을 좀 거치다 보니, 침착하고 효율적으로 문제에 접근하기 시작했던 것 같아서 이때 조금 뿌듯했다.
우리가 우물안 개구리 인 줄도 모르고 말이다.  

![Image](/posts/kc33.png)

결론에 다다른 건 Fuse 문제라고 판단했다.  

> 1. 구글링 3페이지 가량 해본 결과, 동일 현상 동일 문제에 대해 Fuse 교체를 권고.  
>> Fuse를 교체 신청 및 구매하기로 결정하였음.  
> 2. 여러가지 실험의 결과  
>> 2-1. RaspberryPI로부터 전원이 인가되는 방식, 정상 전원 인가.  
>> 2-2. OpenCR 전원을 끊고 RaspberryPI로만 전원 인가, 정상 작동.  
>> 2-3. RaspberryPI 전원을 끊고 OpenCR로만 전원 인가, 미작동.  
>> 2-4. 둘 간의 연결 제거, 각각 독립 전원 인가, OpenCR만 미작동.  

위 과정을 거치고 난 후, Fuse를 주문하는 과정까지 거쳤다.  

---

### 4주차 활동

계절학기가 끝나고, 이제 5주차 활동 보고서 및 결과 발표까지는 우리가 **온전히 터틀봇에 집중**할 수 있게 되었다.  
아니, 정확히는 우리가 터틀봇에 집중해야 할 시기가 온 것이다.  
*(발표까지는 약 8일 가량 남아 있었다.)*  

이 시기부터는 우리가 새벽 두시까지 계속하여 진행했고, 하드웨어와 소프트웨어가 한 일이 너무 다르고 많아 분류하겠다.  

#### TEAM HW
이제는 밤을 새서라도 완성해야 한다는 생각에, 우리는 결의를 다지고 모였다.  
모인 우리가 처음으로 겪은 문제는, OpenCR이 퓨즈를 교체해도 정상 작동을 하지 않는다는 것이었다.  

"잠깐, 우리가 [변인통제](https://ko.wikipedia.org/wiki/%EB%B3%80%EC%9D%B8%ED%86%B5%EC%A0%9C)를 정확하게 하지 않았나?"

분명 우리는 실험 조건에서 달라진 것이라곤 없다고 생각했다. 아니, 그렇게 착각했다.  
바로, 라즈베리파이에는 직접 5V 5A 전원을 인가했고, OpenCR에서는 배터리부 전원 인가를 시도했다는 차이가 있었다.  
그 경우에서 우리는 배터리의 문제점이 있을 수 있다고 판단했다.  
그리하여 멀티미터로 배터리를 찍어보았다.  

![Image](/posts/kc41.png)

*"아악!!!!"*  

멀티미터가 잘못 됐을거라 애써 믿던 우리는 로봇사랑 동아리에서 새로운 배터리를 가져와 전압을 측정해 보았다.  
리튬 폴리머의 특성, 배터리가 낮은 전압으로 오래 유지될 경우 방전될 수 있다는 점을 간과하고 있었다.  
*(랩실에서 오랫동안 짱박혀 있다고 했던 배터리였는데, 왜 이를 간과했을까?)*  
가
오늘도 우리의 무지함을 깨달으며, 새로운 배터리를 인가하자 정상적으로 불빛이 들어왔다.  
그러나, USER4에 붉은 불빛이 들어왔고, 이는 **저전압이 인가**되고 있다는 의미였다.   

이렇게 문제를 하나 해결하자마자 또 주옥같은 문제를 하나 직면하게 되었다.

#### TEAM SW1

본 필자가 속한 팀으로, 본 필자는 이 때 Ubuntu Desktop 22.04 LTS를 Dual Boot로 Ros2 Humble 설치까지 완료된 상황이었다.  
전부 만들었고, 팀 1이 해야할 상황은 로봇 Setup을 진행할 SW2팀이 준비가 끝나면 바로 연결해 시뮬레이션과 RVIZ를 사용할 수 있게 하는 것이었다.  

이상하게도, Sudo apt update를 하자 **404 Error**가 발생하고, 일부 Ros Package가 정상 작동을 하지 않는 문제를 직면했다.  
**Gazebo와 Rviz를 동시 구동시키는 Launchfile을 구성**했음에도, 정상적으로 둘이 연동이 되지 않는 문제점도 있었다.  

즉, **SLAM**을 하기 위해선 우리는 오류를 고쳐야만 했다.  
이 오류는 꼬리에 꼬리를 물어, 하나의 오류를 해결하는 데 구글링을 하며 짧게는 삼십분, 길게는 두 시간이 넘게 걸렸다.  
그리고, 이 덕분에 우리는 Ubuntu 환경에 대한 이해도가 점점 높아지고 있었다.

#### TEAM SW2

노트북과 연결하기 위해선 동일한 네트워크에 연결해야 한다.  
근데, 망할. **와이파이에 연결조차 되지 않는다.**  

ssh를 진행하기 위한 네트워크 Setup부터 진행해야 했고, 우리는 **공개키**를 어떻게 설정해야 하는지 몰라 공개키를 일일이 수백자를 쳤다.   
그럼에도 문제가 해결되지 않았고, **네트워크가 잡히지 않아 네트워크를 바꿔**보기도, **비밀번호를 입력해 보기**도, 오만 난리를 쳤다.  

> Netplan Setup  
>> Netplan을 Setup해 Wifi를 등록하자 비밀번호를 입력해야 한다고 적혀 있었고, 비밀번호를 입력했다.  
>> 권한과 관련된 문제들이 발생했고, 권한을 제공해 주었다.  
>> Network Manager을 설치하라고 했으나, 설치하기 위해선 인터넷이 필요한데...  
>> 인터넷을 위해선 Network Manager을 사용하라는 이런 역설적인 답변도 있었다.  

> 그리하여 다시 Rasbian OS로 복귀.  
>> 현재 Dynamixel, Camera, Laidar 등 정상 작동을 확인하기 위한 과정을 거쳤다.  
>> 그러나, 어마어마한 오류가 등장.  
>> 눈물을 흘리며 오류 해결 시작  

![Image](/posts/kc42.png)

붉은 빛을 보며 우리는 거의 실성할 듯 싶었다.  
일단, Wifi가 연결되지 않는 Raspberry PI 내 Ubuntu Server부터 해결하기로 했다.  
~~한 마디로, 도망쳤다는 뜻이다.~~

이 오류를 확인하고, 일단 움직이기 위한 초석인 **우분투 Server Setup**을 재시도했다.  
(이 과정에서 실수로 Ubuntu Desktop을 설치했고, Firefox를 눌렀다가 그대로 **SD카드가 터져버렸다.**)  

그래서 아침 댓바람부터 다이소를 세 번 넘게 왔다갔다 하며 SD카드, 리더기, 등등 잡다하게 계속해서 사왔다.
모두가 각자 **최악의 상황을 직면**했고, 이를 해결하기 위해 밤을 세워가며 일을 하기 시작했다.

---

### 5주차 활동

*5주차에 도착하자 우리는 사실상 마음이 꺾여갔다.* 
도무지 움직일 수 있을 것이라 생각이 들지 않았다.  
초기에 생각해 두었던 자율주행은 이미 없어진 지 오래였고, 사실 이 와플파이가 **움직여 주기만**을 간절히 빌고 있었다.  

#### TEAM HW

> OpenCR 저전압 문제
>> 저전압 문제의 가능성은 아래와 같음.
>>> 1. 연결부의 문제
>>> 연결부를 확인해 봤으나 문제가 없었고, Multimeter로 측정해 본 결과 배터리 전원부의 전압 만큼 정상 인가되고 있었음.
>>> 2. OpenCR 1.0 자체의 문제
>>> 배터리는 3S(11.1V)를 사용하고 있었는데, 일부 구글링 중 11V 이하가 인가되면 삐-삐- 거린다는 이야기가 있었음.  
>>> 그리고 이 때, USER4에 불이 들어오며 저전압 모드로 변경된다는 것을 확인했음.

두 가지 가능성을 열고 보았으나, 역시 2번에 가까운 문제라고 판단했다.
그런데, 11.1V를 인가했는데 0.1V 이상 떨어지면 **삐-삐- 거리며 저전압 모드로 변경**된다고?
도무지 납득을 할 수는 없었으나, 달리 해결할 방도가 없었다.

> OpenCR Firmware Upload
>> 기존 업로드 방식에서 Ubuntu 22.04LTS의 경우는 Arduino IDE를 통한 Dynamixel Scan 후 Setup이 이루어져야함.
>>> 이 말을 듣고, 우리는 충격에 빠졌다.
>>> 그러나 침착하게, 시간이 얼마 남지 않았지만 아두이노 IDE를 SW1 팀의 노트북에 설치했다.
>>> ~~(솔직히 이런건 좀 잘 적어두지)~~

> Dynamixel Scan fail
>> 이것 때문에 결과적으로는 자율주행을 진행하지 못했다.
>> 스캔이 처음에 한 두번 정도 되었는데, 그 이후 전혀 Scan이 이루어지지 않았다.
>> 결국 실패하고, 열 번이 넘는 재부팅 끝에 한 번 스캔되어 바퀴를 앞 뒤로 움직일 수 있었다.

#### TEAM SW1

> 404 ERROR
>> Sudo apt update시 Archive 한국 서버에서 Ubuntu Server에서 파일을 가져오는 방식을 택한다.
>> 근데 이 과정에서, Ubuntu를 설치한 환경에 따라 amd64, arm64냐에 따라 없기도 한다.
>> 이는 [Ubuntu Essential](https://hs-p.github.io/posts/second)에서 더 자세히 다룬다.
>> amd, arm을 변경해주어 자신의 architecture에 따라 설치하는 과정을 밟아야 한다.
>> (이를 모르고 그냥 구글링하며 복사 붙여넣기만 스무시간 가까이 한 것 같다.)

> Rviz, Gazebo Setup
>> Package를 생성하는 방식에 대해서 이해도가 필요했다.
>> Colcon build의 의미, src 폴더를 사용하는 의미에 대해서 이해도가 확실하게 필요했다.
>> 이는 [ROS2 Diary](https://hs-p.github.io/posts/ros1)에서 더 자세히 다룬다.
>> 단순히 복사해서 붙여넣기를 하면, 패키지를 읽어올 수 없다는 것에 대한 자각조차 없었다.

위의 두 가지 과정을 거쳤을 때, 아직도 SW2 팀은 ssh를 연결하기 전 WIFI SETUP도 제대로 되어있지 못했다.  
어디서부터 꼬여있는건지, 우리는 라즈베리파이에 깔려 있는 **우분투를 아예 밀어버리고 다시 깔기로 했다.**

#### TEAM SW2

> WLAN 미연결 및 ssh 연결 문제
>> Ubuntu Server Setup시 사전 Setup이 되어있어야 하는데, 이 부분이 이루어지지 않았다.
>> 즉, Netplan과 관련된 File이 생성되어 있지 않았고, 이 과정에서 와이파이를 찾을 수 없었다.
>> 우리는 아예 만들어버리고, 따라서 입력했을 때에는 네트워크를 찾지 못했다.
>> (sudo netplan apply 해도 동일.)
>> 리부팅을 몇번 하니, 잡았다. 아무래도 와이파이도 문제, 라즈베리파이의 WIFI Searching ability 역시 둘 다 issue가 있는 모양.
>>  그렇게 잡은 Wifi로 ssh와 기본 SETUP을 실시했으나, 우리는 또 다른 장벽에 막혔다.

![Image](/posts/kc51.png)

놀랍게도, 저렇게 IPv4가 떠 있어도 ping google.com을 통해 ping을 확인해 보면 연결 불가 오류가 뜬다.  
*IP 주소 할당만 되어있을 뿐, 인터넷 연결은 정상적으로 진행되지 않았다.*  

Scan에도 문제가 없고, Netplan, Wpa 관련 모든 파일들을 수정 및 재실행을 해도 같은 문제는 반복되었었다.  
그러나, 위에 언급한 대로, 재부팅을 여러번 진행하다 보니 잡았다.  

> RaspberryPI colcon build fail
>> 이 때, 진짜 지칠대로 지쳐버렸다. RaspberryPI B+의 모델은 Ram이 1GB로, ros2 패키지를 설치하는 도중 Memory 부족으로 인해 멈춰버리고 말았다. (Worker을 늘려도 동일한 현상이 발생한다.)
>> *(구글링 해보니, 램 할당을 2GB로 늘리라고 권장했으나, 보유 모델 램이 1GB인데?)*
>> 그래서 우리는 github에서 직접 clone해 와 colcon build를 하나씩 하나씩 수행했다.
>> (이 과정에서 github 사용과 패키지에 대한 이해도가 높아졌다.)

결과적으로는, 우리는 이 모든 과정을 거치다 운 좋게 Dynamixel이 Scan되며 Raspberry PI도, Remote PC도, **정상 작동을 한 유일한 날**이 나왔다.  
자료 제출 마감 이틀 전이었다. 다음 날이 되자마자 기가 막히게 되지 않았지만, 결론적으로는 Teleop를 통해 우리가 원하는 원격 조종을 성공해냈다.  

다음 게시글에서는 그에 대한 내용을 담고자 한다.  