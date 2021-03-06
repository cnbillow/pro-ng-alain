import {Component, OnInit, ViewChild} from '@angular/core';
import {NzCascaderComponent, NzMessageService} from 'ng-zorro-antd';
import {_HttpClient} from '@delon/theme';
import {
  SimpleTableComponent,
  SimpleTableColumn,
  SimpleTableData,
} from '@delon/abc';
import {debounceTime, map, switchMap} from "rxjs/internal/operators";
import {BehaviorSubject, Observable} from "rxjs/index";

@Component({
  selector: 'cus-account',
  templateUrl: './account.component.html',
})
export class AccountComponent implements OnInit {
  url = `api/account/getAccountInfos`;
  reqMethod = 'post'
  ps = 10;
  balance = 0;
  args: any = {};

  companyObject: any = {};
  communityObject: any = {};
  floorObject: any = {};
  classObject: any = {};

  listOfOption = [];
  nzOptions = [];

  randomUserUrl = 'api/cusinfo/getCusinfoInfos?ps=5&name=';
  searchChange$ = new BehaviorSubject('');
  optionList = [];
  selectedUser;
  isLoading = false;

  onSearch(value: string): void {
    this.isLoading = true;
    this.randomUserUrl = this.randomUserUrl.split('&')[0] + "&name=" + value
    this.searchChange$.next(value);
  }

  public onChanges(values: any): void {
    this.i.classId = values[3]
  }


  getBzStatusType(str: number): string {
    const statusItem = this.bzstatus[str];
    return statusItem.type;
  }

  getBzStatusText(str: number): string {
    const statusItem = this.bzstatus[str];
    return statusItem.text;
  }

  getStatusType(str: number): string {
    const statusItem = this.status[str];
    return statusItem.type;
  }

  getStatusText(str: number): string {
    const statusItem = this.status[str];
    return statusItem.text;
  }

  i: any = {};
  cusinfoId: any = {};
  isVisible = false;
  isConfirmLoading = false;

  loading = false;
  bzstatus = [
    {index: 0, text: '待开户', value: false, type: 'default', checked: false},
    {index: 1, text: '已开户', value: false, type: 'success', checked: false},
    {index: 2, text: '已注销', value: false, type: 'error', checked: false},
  ];
  status = [
    {index: 0, text: '未生效', value: false, type: 'error', checked: false},
    {index: 1, text: '已开户', value: false, type: 'success', checked: false},
    {index: 2, text: '已注销', value: false, type: 'error', checked: false},
  ];
  @ViewChild('st') st: SimpleTableComponent;
  @ViewChild('cascader') cascader: NzCascaderComponent;

  columns: SimpleTableColumn[] = [
    {title: '', index: 'key', type: 'checkbox'},
    {title: '办公室', index: 'meterId.classAllPath', format: (item: any) => this.getClassAllPathName(item)},
    {title: '表号', index: 'meterId.no'},
    {title: '客户', index: 'cusinfoId.name'},
    {title: '余额', index: 'balance'},
    {title: '状态', index: 'status', render: 'status'},
    {title: '更新时间', index: 'date', type: 'date'},
    //{title: '备注', index: 'introduction'},
    {
      title: '操作',
      buttons: [
        {text: '充值', click: (item: any) => this.showModal(item), iif: (item: any) => item.status === 1},
      ],
    },
  ];
  selectedRows: SimpleTableData[] = [];
  expandForm = false;

  constructor(private http: _HttpClient, public msg: NzMessageService) {
    this.getNodes();
  }

  getClassAllPathName(item: any) {
    var companyId = item.meterId.classAllPath[0]
    var communityId = item.meterId.classAllPath[1]
    var floorId = item.meterId.classAllPath[2]
    var classId = item.meterId.classAllPath[3]
    return this.companyObject[companyId] + ","
      + this.communityObject[communityId] + ","
      + this.floorObject[floorId] + ","
      + this.classObject[classId]
  }


  cusinfoIdChange(data) {
    this.i.cusinfoId._id = data;
  }

  getData() {
    this.st.pi = 1;
    this.st.reload()
  }

  ngOnInit() {
    const getRandomNameList = (name: string) => this.http.post(`${this.randomUserUrl}`)
      .pipe(map((res: any) => {
        return res.companyInfos
      }))
    const optionList$: Observable<string[]> = this.searchChange$.asObservable().pipe(debounceTime(500)).pipe(switchMap(getRandomNameList));
    optionList$.subscribe(data => {
      this.optionList = data;
      this.isLoading = false;
    });
  }

  getNodes(): any {
    var ar = []
    this.http
      .post('api/company/getCompanyInfoTree', {})
      .subscribe(
        (obj: any) => {
          if (obj.state == "success") {
            var companyList = obj.companyList;
            var communityList = obj.communityList;
            var floorList = obj.floorList;
            var classList = obj.classList;

            for (var i in companyList) {
              this.companyObject[companyList[i]._id] = companyList[i].name
              var companyObj = {
                label: companyList[i].name,
                value: companyList[i]._id,
                children: []
              }

              for (var j in communityList) {
                this.communityObject[communityList[j]._id] = communityList[j].name
                if (companyList[i]._id === communityList[j].companyId) {
                  var communityObj = {
                    label: communityList[j].name,
                    value: communityList[j]._id,
                    children: []
                  }

                  for (var k in floorList) {
                    this.floorObject[floorList[k]._id] = floorList[k].name
                    if (communityList[j]._id === floorList[k].communityId) {
                      var floorObj = {
                        label: floorList[k].name,
                        value: floorList[k]._id,
                        children: []
                      }
                      for (var o in classList) {
                        this.classObject[classList[o]._id] = classList[o].name
                        if (floorList[k]._id === classList[o].floorId) {
                          var classObj = {
                            label: classList[o].name,
                            value: classList[o]._id,
                            isLeaf: true,
                          }
                          floorObj.children.push(classObj)
                        }
                      }
                      if (floorObj.children.length > 0) {
                        communityObj.children.push(floorObj)
                      }
                    }
                  }
                  if (communityObj.children.length > 0) {
                    companyObj.children.push(communityObj)
                  }
                }
              }
              if (companyObj.children.length > 0) {
                ar.push(companyObj)
              }
            }
            this.nzOptions = ar;
          } else {
            this.msg.error(obj.message)
          }
        }
      )

    this.http
      .post('api/cusinfo/getCusinfoInfos?ps=999&pi=1', {})
      .subscribe(
        (obj: any) => {
          if (obj.state == "success") {
            this.listOfOption = []
            for (var i in obj.companyInfos) {
              this.listOfOption.push({label: obj.companyInfos[i].name, value: obj.companyInfos[i]._id})
            }
          } else {
            this.msg.error(obj.message)
          }
        }
      )
  }

  checkboxChange(list: SimpleTableData[]) {
    this.selectedRows = list;
  }

  reset(ls: any[]) {
    for (const item of ls) item.value = false;
    this.st.reload()
  }

  showModal(item?: any): void {
    this.balance = 0;
    if (item) {
      this.i = item;
      if (this.i.cusinfoId) {
        this.cusinfoId = this.i.cusinfoId
      }
    } else {
      this.i = {cusinfoId: {}, classAllPath: []}
      this.cusinfoId = {}
      // this.cascader.in
    }
    this.isVisible = true;
  }

  handleOk(): void {
    this.isConfirmLoading = true;
    console.log(this.i)
    this.http
      .post('api/account/addBalanceInfo', {_id: this.i._id, balance: this.balance}).subscribe(
      (obj: any) => {
        if (obj.state == "success") {
          this.isConfirmLoading = false;
          this.isVisible = false;
          this.st.reload()
        } else {
          this.isConfirmLoading = false;
          this.msg.error(obj.message)
        }
      }
    )
  }

  handleCancel(): void {
    this.st.reload()
    this.isVisible = false;
  }

}
